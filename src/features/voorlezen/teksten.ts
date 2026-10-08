import { tekstVoorVoorlezen } from "@/components/mees/Breuk";
import type { Vraag } from "@/features/oefenen/vragen";

// Eén plek voor wat er wordt voorgelezen. Browser, server en het vooraf maken gebruiken dezelfde tekst,
// zodat elke tekst precies één keer bij ElevenLabs wordt gemaakt en daarna uit de opslag komt.

/** Stem (Ruth, kinderverteller) en model. Een andere stem of model geeft nieuwe bestanden. */
export const voorleesConfig = { stem: "yO6w2xlECAQRFP6pX7Hw", model: "eleven_multilingual_v2", bucket: "voorlezen", maxTekens: 600 } as const;

export const normaliseer = (tekst: string) => tekstVoorVoorlezen(tekst).replace(/\s+/g, " ").trim();

/** Bestandsnaam van de gesproken tekst (sha-256), in de browser en op de server gelijk. */
export async function voorleesPad(tekst: string) {
  const data = new TextEncoder().encode(`${voorleesConfig.stem}|${voorleesConfig.model}|${normaliseer(tekst)}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return `${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("")}.mp3`;
}

export const publiekeVoorleesUrl = (pad: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${voorleesConfig.bucket}/${pad}`;

export function vraagVoorleesTekst(vraag: Vraag) {
  return vraag.soort === "breuk"
    ? `${vraag.prompt} ${vraag.visual.links.join("/")} en ${vraag.visual.rechts.join("/")}. ${vraag.instructie}`
    : `${vraag.prompt.replace("×", "keer").replace(":", "gedeeld door")} ${vraag.instructie}`;
}

/** Hint 1 of 2 (index 0 of 1). */
export const hintVoorleesTekst = (vraag: Vraag, i: number) => `Hint ${i + 1}. ${vraag.hints[i] ?? ""}`;

/** Uitleg met het goede antwoord in woorden (geen losse tekens als "<"). */
export function uitlegVoorleesTekst(vraag: Vraag) {
  const antwoord = vraag.soort === "breuk" ? vraag.antwoordInWoorden : vraag.soort === "tafel" ? String(vraag.answer) : vraag.doelNaam;
  return `Uitleg. ${vraag.explanation} Het goede antwoord is: ${antwoord}.`;
}

export const weetjeVoorleesTekst = (w: { titel: string; kort: string; tekst: string }) => `${w.titel}. ${w.kort} ${w.tekst}`;
