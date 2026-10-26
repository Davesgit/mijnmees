// Oefenen in het gesprek: het verloop van één vraagplaats als reeks gespreksstappen, afgeleid uit de opslag
// (slot + pogingen). Zo blijft elke poging zichtbaar en kan het gesprek na herladen of hervatten exact
// opnieuw worden opgebouwd. De oefenmotor (sessie.ts) blijft de enige die bepaalt wat goed is en wat telt.

import type { Poging, Sessie, Slot } from "@/features/oefenen/types";

export type Hulp = { soort: "hint"; niveau: 1 | 2 } | { soort: "uitleg" };

export type Stap =
  /** Een poging op de vraag (bevroren) of de vraag die nu openstaat (open). */
  | { soort: "vraag"; poging: number; antwoord?: string; status: "fout" | "goed" | "open"; opnieuw: boolean }
  /** Fout antwoord: "Nog niet helemaal", het gekozen antwoord en eventueel nieuwe hulp. */
  | { soort: "fout"; antwoord: string; hulp: Hulp | null }
  /** Hulp waar het kind zelf om vroeg (neutraal, niet oranje). */
  | { soort: "hulp"; hulp: Hulp }
  | { soort: "goed"; metHulp: boolean }
  /** De uitleg staat er; het kind gaat verder met de knop Verder. */
  | { soort: "verder" };

/** Hulp die de motor geeft na het zoveelste foute antwoord (zie registreerAntwoord). */
function hulpNaFout(fouten: number): Hulp | null {
  if (fouten >= 4) return { soort: "uitleg" };
  if (fouten === 3) return { soort: "hint", niveau: 2 };
  if (fouten === 2) return { soort: "hint", niveau: 1 };
  return null;
}

export function verloopVanSlot(slot: Slot, pogingen: Poging[]): Stap[] {
  const stappen: Stap[] = [];
  let hints = 0;
  let uitleg = false;
  let fouten = 0;

  const vraagHints = (tot: number) => {
    for (let h = hints + 1; h <= Math.min(tot, 2); h++) stappen.push({ soort: "hulp", hulp: { soort: "hint", niveau: h as 1 | 2 } });
    hints = Math.max(hints, Math.min(tot, 2));
  };

  pogingen.forEach((p, i) => {
    vraagHints(p.hulpVooraf.hints);
    stappen.push({ soort: "vraag", poging: i + 1, antwoord: p.antwoord, status: p.resultaat, opnieuw: i > 0 || hints > 0 });
    if (p.resultaat === "goed") {
      stappen.push({ soort: "goed", metHulp: fouten > 0 || hints > 0 });
      return;
    }
    fouten++;
    let hulp = hulpNaFout(fouten);
    // Een hint die het kind al had gevraagd, komt niet nog eens.
    if (hulp?.soort === "hint" && hulp.niveau <= hints) hulp = null;
    if (hulp?.soort === "hint") hints = hulp.niveau;
    if (hulp?.soort === "uitleg") uitleg = true;
    stappen.push({ soort: "fout", antwoord: p.antwoord, hulp });
  });

  if (slot.uitkomst === "zelfstandig" || slot.uitkomst === "met-hulp") return stappen;

  // Hulp die na de laatste poging is gevraagd.
  vraagHints(slot.hulp.hints);
  if (slot.hulp.uitleg && !uitleg) stappen.push({ soort: "hulp", hulp: { soort: "uitleg" } });

  if (slot.hulp.uitleg) {
    if (!slot.uitkomst) stappen.push({ soort: "verder" });
    return stappen;
  }
  stappen.push({ soort: "vraag", poging: pogingen.length + 1, status: "open", opnieuw: pogingen.length > 0 || hints > 0 });
  return stappen;
}

/** Kan deze oefening in het gesprek? Europa (kaart) en tafels met tijd blijven op hun eigen scherm. */
export function kanInChat(sessie: Sessie) {
  const soort = sessie.soort ?? "oefening";
  return soort === "oefening" || (soort === "tafels" && !sessie.instellingen?.metTijd);
}

/** Teller voor de voortgangsbalk: afgeronde vraagplaatsen en wat er nog komt. */
export function oefenTeller(sessie: Sessie) {
  const klaar = sessie.slots.filter((s) => s.uitkomst).length;
  const totaal = sessie.slots.length;
  return { nummer: Math.min(sessie.index + 1, totaal), totaal, klaar, nogTeDoen: totaal - klaar };
}

export const AANTAL_KEUZES = [4, 6, 8] as const;
export const STANDAARD_AANTAL = 6;
