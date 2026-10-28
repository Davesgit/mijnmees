// Oefenen in het gesprek: het verloop van één vraagplaats als reeks gespreksstappen, afgeleid uit de opslag
// (slot + pogingen). Zo blijft elke poging zichtbaar en kan het gesprek na herladen of hervatten exact
// opnieuw worden opgebouwd. De oefenmotor (sessie.ts) blijft de enige die bepaalt wat goed is en wat telt.

import type { Poging, Sessie, Slot } from "@/features/oefenen/types";
import { hulpNaFout as motorHulp } from "@/features/oefenen/sessie";
import type { Vraag } from "@/features/oefenen/vragen";

export type Hulp = { soort: "hint"; niveau: 1 | 2 } | { soort: "uitleg" };

export type Stap =
  /** Een poging op de vraag (bevroren), de vraag waarbij om hulp werd gevraagd, of de vraag die nu openstaat (open). */
  | { soort: "vraag"; poging: number; antwoord?: string; status: "fout" | "goed" | "hulp" | "open"; opnieuw: boolean }
  /** Het kind vraagt om hulp (verschijnt als eigen chatbericht). */
  | { soort: "hulpVraag"; hulp: Hulp }
  /** Fout antwoord: "Nog niet helemaal", het gekozen antwoord en eventueel nieuwe hulp. */
  | { soort: "fout"; antwoord: string; hulp: Hulp | null }
  /** Hulp waar het kind zelf om vroeg (neutraal, niet oranje). */
  | { soort: "hulp"; hulp: Hulp }
  | { soort: "goed"; metHulp: boolean }
  /** De uitleg staat er; het kind gaat verder met de knop Verder. */
  | { soort: "verder" };

/** Hulp die de motor geeft na het zoveelste foute antwoord (zie hulpNaFout in sessie.ts). Null: al gegeven. */
function hulpNaFout(vraag: Vraag, fouten: number, hints: number): Hulp | null {
  const h = motorHulp(vraag, fouten, hints);
  if (h.parkeer) return { soort: "uitleg" };
  return h.hints > hints ? { soort: "hint", niveau: h.hints as 1 | 2 } : null;
}

export function verloopVanSlot(slot: Slot, pogingen: Poging[], vraag: Vraag): Stap[] {
  const stappen: Stap[] = [];
  let hints = 0;
  let uitleg = false;
  let fouten = 0;

  let getoond = 0;
  /** Gevraagde hulp, zoals in een chat: de vraag, dan het verzoek van het kind, dan de hulp van Mees eronder. */
  const vraagHulpOm = (hulp: Hulp) => {
    stappen.push({ soort: "vraag", poging: ++getoond, status: "hulp", opnieuw: getoond > 1 || hints > 0 });
    stappen.push({ soort: "hulpVraag", hulp });
    stappen.push({ soort: "hulp", hulp });
  };
  const vraagHints = (tot: number) => {
    for (let h = hints + 1; h <= Math.min(tot, 2); h++) {
      vraagHulpOm({ soort: "hint", niveau: h as 1 | 2 });
      hints = h;
    }
  };

  pogingen.forEach((p) => {
    vraagHints(p.hulpVooraf.hints);
    stappen.push({ soort: "vraag", poging: ++getoond, antwoord: p.antwoord, status: p.resultaat, opnieuw: getoond > 1 });
    if (p.resultaat === "goed") {
      stappen.push({ soort: "goed", metHulp: fouten > 0 || hints > 0 });
      return;
    }
    fouten++;
    const hulp = hulpNaFout(vraag, fouten, hints);
    if (hulp?.soort === "hint") hints = hulp.niveau;
    if (hulp?.soort === "uitleg") uitleg = true;
    stappen.push({ soort: "fout", antwoord: p.antwoord, hulp });
  });

  if (slot.uitkomst === "zelfstandig" || slot.uitkomst === "met-hulp") return stappen;

  // Hulp die na de laatste poging is gevraagd.
  vraagHints(slot.hulp.hints);
  if (slot.hulp.uitleg && !uitleg) vraagHulpOm({ soort: "uitleg" });

  if (slot.hulp.uitleg) {
    if (!slot.uitkomst) stappen.push({ soort: "verder" });
    return stappen;
  }
  stappen.push({ soort: "vraag", poging: ++getoond, status: "open", opnieuw: getoond > 1 });
  return stappen;
}

/** Kan deze oefening in het gesprek? Alleen de niveaubepaling en tutorcontrole volgen nog. */
export function kanInChat(sessie: Sessie) {
  const soort = sessie.soort ?? "oefening";
  return soort === "oefening" || soort === "tafels" || soort === "europa" || soort === "puzzel";
}

/** Teller voor de voortgangsbalk: afgeronde vraagplaatsen en wat er nog komt. */
export function oefenTeller(sessie: Sessie) {
  const klaar = sessie.slots.filter((s) => s.uitkomst).length;
  const totaal = sessie.slots.length;
  return { nummer: Math.min(sessie.index + 1, totaal), totaal, klaar, nogTeDoen: totaal - klaar };
}

export const AANTAL_KEUZES = [4, 6, 8] as const;
export const STANDAARD_AANTAL = 6;

// ── De chatbalk tijdens het oefenen ──────────────────────────────────────────────────────────────────────────────
// Antwoorden en opdrachten kunnen als klikbare optie of als getypte tekst; de oefenmotor beoordeelt het antwoord.

/** Waar staat de open vraagplaats: antwoorden, goed (verder met de volgende) of uitleg gelezen (verder). */
export type Fase = "antwoorden" | "goed" | "uitleg";

export function faseVan(slot: Slot): Fase {
  if (slot.uitkomst === "zelfstandig" || slot.uitkomst === "met-hulp") return "goed";
  if (slot.hulp.uitleg) return "uitleg";
  return "antwoorden";
}

export type Snelkeuze = { label: string; waarde: string };

const tekenLabel: Record<string, string> = { "<": "<  kleiner dan", "=": "=  is gelijk aan", ">": ">  groter dan" };

/** Klikbare antwoorden voor de chatbalk (leeg bij tafels: dan typ je het getal, en bij "Waar ligt …": tik op de kaart). */
export function antwoordOpties(vraag: Vraag, slot: Slot): Snelkeuze[] {
  if (vraag.soort === "breuk") return vraag.options.map((o) => ({ label: tekenLabel[o] ?? o, waarde: o }));
  if (vraag.soort === "europa" && vraag.type === "choice") return (vraag.opties ?? slot.opties ?? []).map((o) => ({ label: o.label, waarde: o.id }));
  return [];
}

const schoon = (t: string) =>
  ` ${t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.!?,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

/** Een opdracht in getypte tekst: om hulp vragen, pauzeren of verder gaan. */
export function leesOpdracht(tekst: string): "hint" | "pauze" | "verder" | null {
  const t = schoon(tekst);
  if (/ (hint|help|hulp|tip|snap|begrijp|weet het niet|weet ik niet|geen idee|uitleg) /.test(t)) return "hint";
  if (/ (pauze|stop|stoppen|ophouden|klaar voor nu|even niet) /.test(t)) return "pauze";
  if (/^ (volgende|volgende vraag|verder|ga door|ga verder|next|ok|oke|okay|rond af) $/.test(t)) return "verder";
  return null;
}

/** Een antwoord in getypte tekst, of null als de tekst geen antwoord op deze vraag is. */
export function leesAntwoord(tekst: string, vraag: Vraag, slot: Slot, namen: Record<string, string>): string | null {
  const t = schoon(tekst);
  if (vraag.soort === "tafel") {
    const getal = t.match(/^ (\d{1,4}) $/) ?? t.match(/ (?:is|=) (\d{1,4}) $/);
    return getal ? getal[1]! : null;
  }
  if (vraag.soort === "breuk") {
    if (/^ (<|kleiner|kleiner dan|is kleiner|minder) $/.test(t)) return "<";
    if (/^ (>|groter|groter dan|is groter|meer) $/.test(t)) return ">";
    if (/^ (=|gelijk|is gelijk|even groot|hetzelfde) $/.test(t)) return "=";
    return null;
  }
  if (vraag.type === "choice") {
    const opties = vraag.opties ?? slot.opties ?? [];
    return opties.find((o) => schoon(o.label) === t)?.id ?? null;
  }
  // "Waar ligt …?": de naam van een plek typen kan ook.
  return Object.entries(namen).find(([, naam]) => schoon(naam) === t)?.[0] ?? null;
}
