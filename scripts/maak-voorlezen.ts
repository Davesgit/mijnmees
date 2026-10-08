// Maakt de gesproken versie van alle vaste teksten vooraf (vragen breuken en tafels, weetjes),
// zodat voorlezen overal meteen start. Al bestaande bestanden worden overgeslagen (kost niets).
// Gebruik:  npx tsx --env-file=.env.local scripts/maak-voorlezen.ts            (alleen tellen)
//           npx tsx --env-file=.env.local scripts/maak-voorlezen.ts --maak     (echt maken)
import { createClient } from "@supabase/supabase-js";
import { weetjes } from "../src/content/weetjes";
import { TAFELS, tafelVraag } from "../src/features/oefenen/tafel-vragen";
import { vragenVoorLeerdoel, type Vraag } from "../src/features/oefenen/vragen";
import { hintVoorleesTekst, normaliseer, publiekeVoorleesUrl, uitlegVoorleesTekst, vraagVoorleesTekst, voorleesConfig, voorleesPad, weetjeVoorleesTekst } from "../src/features/voorlezen/teksten";

const maak = process.argv.includes("--maak");
const sleutel = process.env.ELEVENLABS_API_KEY;
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

const teksten = new Set<string>();
const metHulp = (v: Vraag) => [vraagVoorleesTekst(v), hintVoorleesTekst(v, 0), hintVoorleesTekst(v, 1), uitlegVoorleesTekst(v)].forEach((t) => teksten.add(normaliseer(t)));
for (const v of vragenVoorLeerdoel("breuken-vergelijken")) metHulp(v);
for (const t of TAFELS)
  for (let f = 1; f <= 10; f++) {
    for (const id of [`tafel-${t}-x-${f}`, `tafel-${t}-d-${t * f}`]) {
      const v = tafelVraag(id);
      if (v) metHulp(v);
    }
  }
for (const w of weetjes) teksten.add(normaliseer(weetjeVoorleesTekst(w)));

async function main() {
  const lijst = [...teksten].filter((t) => t.length <= voorleesConfig.maxTekens);
  let bestaand = 0;
  const nodig: { tekst: string; pad: string }[] = [];
  // 20 tegelijk controleren of de audio al bestaat.
  for (let i = 0; i < lijst.length; i += 20) {
    const groep = await Promise.all(
      lijst.slice(i, i + 20).map(async (tekst) => {
        const pad = await voorleesPad(tekst);
        const ok = await fetch(publiekeVoorleesUrl(pad), { method: "HEAD" }).then((r) => r.ok).catch(() => false);
        return { tekst, pad, ok };
      }),
    );
    for (const g of groep) {
      if (g.ok) bestaand++;
      else nodig.push({ tekst: g.tekst, pad: g.pad });
    }
  }
  const tekens = nodig.reduce((s, n) => s + n.tekst.length, 0);
  console.log(`${lijst.length} teksten, ${bestaand} al gemaakt, ${nodig.length} nog te maken (${tekens} tekens).`);

  if (maak) {
    if (!sleutel) throw new Error("ELEVENLABS_API_KEY ontbreekt.");
    let klaar = 0;
    for (const { tekst, pad } of nodig) {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voorleesConfig.stem}?output_format=mp3_44100_64`, {
        method: "POST",
        headers: { "xi-api-key": sleutel, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text: tekst, model_id: voorleesConfig.model, voice_settings: { stability: 0.6, similarity_boost: 0.75, speed: 0.92 } }),
      });
      if (!r.ok) {
        console.log(`Gestopt bij ${klaar}/${nodig.length}: ElevenLabs gaf ${r.status} (${(await r.text()).slice(0, 160)})`);
        break;
      }
      const { error } = await db.storage.from(voorleesConfig.bucket).upload(pad, new Uint8Array(await r.arrayBuffer()), { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" });
      if (error) console.log("Opslaan mislukt:", error.message);
      else klaar++;
      if (klaar % 25 === 0) console.log(`${klaar}/${nodig.length}`);
    }
    console.log(`Klaar: ${klaar} gemaakt.`);
  }
}

void main();
