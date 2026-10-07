import breukenVergelijken from "@/content/vragen/breuken-vergelijken.json";

export type Niveau = "makkelijk" | "past-bij-mij" | "uitdagend";
export type Teken = "<" | "=" | ">";

export type BreukVergelijkVraag = {
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

export type Vraag = BreukVergelijkVraag;

const alleVragen = breukenVergelijken as unknown as Vraag[];
const perId = new Map(alleVragen.map((v) => [v.id, v]));

export function vindVraag(id: string): Vraag | null {
  return perId.get(id) ?? null;
}

export function vragenVoorLeerdoel(leerdoelId: string): Vraag[] {
  return alleVragen.filter((v) => v.learningGoalId === leerdoelId);
}

export function heeftVragen(leerdoelId: string | null) {
  return leerdoelId !== null && vragenVoorLeerdoel(leerdoelId).length > 0;
}

/** Vergelijkt het gegeven antwoord met het juiste antwoord. */
export function isGoed(vraag: Vraag, antwoord: string) {
  return vraag.answer === antwoord;
}
