import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { normaliseer, publiekeVoorleesUrl, voorleesConfig, voorleesPad } from "@/features/voorlezen/teksten";
import { createAdminClient } from "@/lib/supabase/admin";

// Voorlezen met ElevenLabs. De sleutel blijft op de server. Elke tekst wordt één keer gemaakt en daarna
// uit de opslag geleverd. Geen persoonsgegevens: alleen vaste lestekst. Lukt het niet, dan valt de
// browser terug op de eigen computerstem.

const BUCKET = voorleesConfig.bucket;
const MAX_TEKENS = voorleesConfig.maxTekens;
const PER_UUR_PER_GEBRUIKER = 60;
const DAGBUDGET = Number(process.env.ELEVENLABS_DAGBUDGET ?? 30000);

const antwoord = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return antwoord({ status: "geweigerd" }, 403);
  const sleutel = process.env.ELEVENLABS_API_KEY;
  const { stem, model: MODEL } = voorleesConfig;
  if (!sleutel) return antwoord({ status: "niet-ingesteld" }, 503);

  const body = (await request.json().catch(() => null)) as { tekst?: unknown } | null;
  const tekst = normaliseer(String(body?.tekst ?? ""));
  if (!tekst || tekst.length > MAX_TEKENS) return antwoord({ status: "ongeldig" }, 400);

  const db = createAdminClient();
  const pad = await voorleesPad(tekst);
  const publiek = publiekeVoorleesUrl(pad);

  // Al gemaakt? Dan kost het niets.
  const bestaat = await fetch(publiek, { method: "HEAD", cache: "no-store" }).then((r) => r.ok).catch(() => false);
  if (bestaat) return antwoord({ url: publiek });

  // Begrenzing: per gebruiker (gehasht IP + dag, niet te herleiden) en een dagbudget voor heel Mees.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  const bron = createHash("sha256").update(`${ip}|${new Date().toISOString().slice(0, 10)}|${process.env.MEES_COOKIE_SECRET ?? ""}`).digest("hex").slice(0, 32);
  const uurGeleden = new Date(Date.now() - 3600_000).toISOString();
  const vandaag = new Date(new Date().toISOString().slice(0, 10)).toISOString();
  const [{ count: perUur }, { data: dagRijen }] = await Promise.all([
    db.from("voorlees_verzoeken").select("*", { count: "exact", head: true }).eq("bron", bron).gte("op", uurGeleden),
    db.from("voorlees_verzoeken").select("tekens").gte("op", vandaag).limit(10000),
  ]);
  const dagTotaal = (dagRijen ?? []).reduce((s, r) => s + (r.tekens as number), 0);
  if ((perUur ?? 0) >= PER_UUR_PER_GEBRUIKER || dagTotaal + tekst.length > DAGBUDGET) return antwoord({ status: "limiet" }, 429);

  const el = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(stem)}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": sleutel, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: tekst,
      model_id: MODEL,
      ...(/(flash|turbo)_v2_5/.test(MODEL) ? { language_code: "nl" } : {}),
      voice_settings: { stability: 0.6, similarity_boost: 0.75, speed: 0.92 },
    }),
  }).catch(() => null);
  if (!el?.ok) return antwoord({ status: "mislukt" }, 502);

  const audio = new Uint8Array(await el.arrayBuffer());
  await db.from("voorlees_verzoeken").insert({ bron, tekens: tekst.length });
  const { error } = await db.storage.from(BUCKET).upload(pad, audio, { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" });
  if (error) {
    // Opslaan mislukt: toch afspelen, rechtstreeks.
    return new NextResponse(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  }
  return antwoord({ url: publiek });
}
