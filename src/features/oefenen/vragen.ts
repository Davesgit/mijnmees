import breukenVergelijken from "@/content/vragen/breuken-vergelijken.json";
import { europaVraag, europaVragenVoorLeerdoel, namen, type EuropaVraag } from "./europa-vragen";
import { tafelVraag, tafelVragenVoorLeerdoel, type TafelVraag } from "./tafel-vragen";

export type Niveau = "makkelijk" | "past-bij-mij" | "uitdagend";
export type Teken = "<" | "=" | ">";

export type BreukVergelijkVraag = {
  soort: "breuk";
  id: string;
  version: number;
  type: "meerkeuze";
  subjectId: "rekenen";
  topicId: string;
  learningGoalId: string;
  prerequisites: string[];
  groupRange: [number, number];
  difficulty: Niveau;
  prompt: string;
  instructie: string;
  options: Teken[];
  visual: { soort: "breuk-vergelijking"; links: [number, number]; rechts: [number, number] };
  answer: Teken;
  hints: [string, string];
  explanation: string;
  antwoordInWoorden: string;
  review: { status: "demo-only" | "draft" | "approved" | "archived"; reviewerId: string | null };
};

export type { EuropaVraag, TafelVraag };
export type Vraag = BreukVergelijkVraag | TafelVraag | EuropaVraag;

const breukVragen = (breukenVergelijken as unknown as Omit<BreukVergelijkVraag, "soort">[]).map(
  (v): BreukVergelijkVraag => ({ ...v, soort: "breuk" }),
);
const breukPerId = new Map(breukVragen.map((v) => [v.id, v]));

/** Vindt een vraag op id; werkt op client en server (de server beoordeelt hiermee opnieuw). */
export function vindVraag(id: string): Vraag | null {
  return breukPerId.get(id) ?? tafelVraag(id) ?? europaVraag(id);
}

export function vragenVoorLeerdoel(leerdoelId: string): Vraag[] {
  if (leerdoelId.startsWith("tafel-") || leerdoelId.startsWith("deeltafel-")) return tafelVragenVoorLeerdoel(leerdoelId);
  if (leerdoelId.startsWith("europa-")) return europaVragenVoorLeerdoel(leerdoelId);
  return breukVragen.filter((v) => v.learningGoalId === leerdoelId);
}

export function heeftVragen(leerdoelId: string | null) {
  return leerdoelId !== null && vragenVoorLeerdoel(leerdoelId).length > 0;
}

/** Vergelijkt het gegeven antwoord met het juiste antwoord. */
export function isGoed(vraag: Vraag, antwoord: string) {
  switch (vraag.soort) {
    case "breuk":
      return vraag.answer === antwoord;
    case "tafel": {
      const getal = Number(antwoord.trim().replace(",", "."));
      return antwoord.trim() !== "" && Number.isFinite(getal) && getal === vraag.answer;
    }
    case "europa":
      return vraag.doel === antwoord;
  }
}

/** Het goede antwoord in woorden, voor de uitleg. */
export function goedAntwoordTekst(vraag: Vraag) {
  switch (vraag.soort) {
    case "breuk":
      return `${vraag.answer} (${vraag.antwoordInWoorden})`;
    case "tafel":
      return String(vraag.answer);
    case "europa":
      return vraag.doelNaam;
  }
}

/** Korte weergave van de opgave (ouderoverzicht). */
export function opgaveTekst(vraag: Vraag) {
  switch (vraag.soort) {
    case "breuk":
      return `${vraag.visual.links.join("/")}  ?  ${vraag.visual.rechts.join("/")}`;
    case "tafel":
      return `${vraag.links} ${vraag.bewerking === "x" ? "×" : ":"} ${vraag.rechts}`;
    case "europa":
      return vraag.type === "puzzel" ? `Leg ${vraag.doelNaam}` : vraag.prompt;
  }
}

/** Het gegeven antwoord leesbaar maken (Europa: id → naam). */
export function antwoordTekst(vraag: Vraag | null, antwoord: string) {
  if (vraag?.soort === "europa") return namen[antwoord] ?? antwoord;
  return antwoord;
}
