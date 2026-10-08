// Maakt de gesproken versie van alle vaste teksten vooraf (vragen breuken en tafels, weetjes),
// zodat voorlezen overal meteen start. Al bestaande bestanden worden overgeslagen (kost niets).
// Gebruik:  npx tsx --env-file=.env.local scripts/maak-voorlezen.ts            (alleen tellen)
//           npx tsx --env-file=.env.local scripts/maak-voorlezen.ts --maak     (echt maken)
import { createClient } from "@supabase/supabase-js";
import { weetjes } from "../src/content/weetjes";
import { TAFELS, tafelVraag } from "../src/features/oefenen/tafel-vragen";
import { vragenVoorLeerdoel } from "../src/features/oefenen/vragen";
import { normaliseer, publiekeVoorleesUrl, vraagVoorleesTekst, voorleesConfig, voorleesPad, weetjeVoorleesTekst } from "../src/features/voorlezen/teksten";

const maak = process.argv.includes("--maak");
const sleutel = process.env.ELEVENLABS_API_KEY;
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

const teksten = new Set<string>();
for (const v of vragenVoorLeerdoel("breuken-vergelijken")) teksten.add(normaliseer(vraagVoorleesTekst(v)));
for (const t of TAFELS)
  for (let f = 1; f <= 10; f++) {
    for (const id of [`tafel-${t}-x-${f}`, `tafel-${t}-d-${t * f}`]) {
      const v = tafelVraag(id);
      if (v) teksten.add(normaliseer(vraagVoorleesTekst(v)));
    }
  }
for (const w of weetjes) teksten.add(normaliseer(weetjeVoorleesTekst(w)));

async function main() {
  const lijst = [...teksten].filter((t) => t.length <= voorleesConfig.maxTekens);
  let bestaand = 0;
  const nodig: { tekst: string; pad: string }[] = [];
  for (const tekst of lijst) {
    const pad = await voorleesPad(tekst);
    const ok = await fetch(publiekeVoorleesUrl(pad), { method: "HEAD" }).then((r) => r.ok).catch(() => false);
    if (ok) bestaand++;
    else nodig.push({ tekst, pad });
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
