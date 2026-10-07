import namenData from "@/content/europa/namen.json";
import vragenData from "@/content/europa/vragen.json";

// Europa-vragen uit de bestaande trainer (content, review-required). Kaartvormen staan apart in kaart.json.

export type EuropaModule = "countries" | "capitals" | "waters" | "rivers" | "mountains" | "relative" | "puzzel";

type BronVraag = {
  id: string;
  module: Exclude<EuropaModule, "puzzel">;
  vaardigheid: string;
  type: "map-click" | "choice";
  vraag: string;
  doel: string;
  hint: string;
  markering?: string;
  opties?: { id: string; label: string }[];
  vereist?: string[];
  referentie?: string;
  focus?: string;
};

export type EuropaVraag = {
  soort: "europa";
  id: string;
  version: 1;
  module: EuropaModule;
  type: "map-click" | "choice" | "puzzel";
  learningGoalId: string;
  difficulty: "past-bij-mij";
  prompt: string;
  instructie: string;
  doel: string;
  doelNaam: string;
  markering?: string;
  /** Vaste opties (liggingsvragen). Andere meerkeuzevragen krijgen opties per sessie. */
  opties?: { id: string; label: string }[];
  referentie?: string;
  vereist?: string[];
  hints: [string, string];
  explanation: string;
};

export const namen = namenData as Record<string, string>;
const bron = vragenData as BronVraag[];

export const europaLeerdoel: Record<EuropaModule, string> = {
  countries: "europa-landen",
  puzzel: "europa-landen",
  capitals: "europa-hoofdsteden",
  waters: "europa-wateren",
  rivers: "europa-wateren",
  mountains: "europa-gebergten",
  relative: "europa-ligging",
};

const eersteHint: Record<EuropaModule, string> = {
  countries: "Kijk naar de vorm, de kust en de landen eromheen.",
  puzzel: "Kijk naar de vorm en de buurlanden.",
  capitals: "Denk aan het land waar deze stad in ligt. Kijk ook naar de ligging.",
  waters: "Kijk tussen welke landen het water ligt.",
  rivers: "Volg de rivier van het binnenland naar de kust.",
  mountains: "Een gebergte kan over meerdere landsgrenzen lopen.",
  relative: "Gebruik de windroos: noord is boven, oost rechts, zuid onder en west links.",
};

function maak(q: BronVraag): EuropaVraag {
  const doelNaam = namen[q.doel] ?? q.opties?.find((o) => o.id === q.doel)?.label ?? q.doel;
  return {
    soort: "europa",
    id: q.id,
    version: 1,
    module: q.module,
    type: q.type,
    learningGoalId: europaLeerdoel[q.module],
    difficulty: "past-bij-mij",
    prompt: q.type === "choice" && q.markering && q.module === "countries" ? "Welk land is gekleurd?" : q.vraag,
    instructie: q.type === "map-click" ? "Tik een plek aan en controleer je antwoord." : "Kies het juiste antwoord.",
    doel: q.doel,
    doelNaam,
    markering: q.markering,
    opties: q.module === "relative" ? q.opties : undefined,
    referentie: q.referentie,
    vereist: q.vereist,
    hints: [eersteHint[q.module], q.hint],
    explanation:
      q.type === "map-click"
        ? `Dit is ${doelNaam}. Kijk waar het op de kaart oplicht. Je oefent dit later nog eens.`
        : `Het goede antwoord is ${doelNaam}. Je oefent dit later nog eens.`,
  };
}

const perId = new Map(bron.map((q) => [q.id, maak(q)]));

function puzzelVraag(landId: string): EuropaVraag | null {
  const naam = namen[landId];
  if (!naam || !perId.has(`country-${landId}`)) return null;
  return {
    soort: "europa",
    id: `puzzel-${landId}`,
    version: 1,
    module: "puzzel",
    type: "puzzel",
    learningGoalId: europaLeerdoel.puzzel,
    difficulty: "past-bij-mij",
    prompt: "Leg de landen op hun plek",
    instructie: "Tik een land aan en tik daarna op de kaart.",
    doel: landId,
    doelNaam: naam,
    hints: [eersteHint.puzzel, perId.get(`country-${landId}`)!.hints[1]],
    explanation: `Hier ligt ${naam}. Het stukje is nu op zijn plek gelegd.`,
  };
}

export function europaVraag(id: string): EuropaVraag | null {
  if (id.startsWith("puzzel-")) return puzzelVraag(id.slice(7));
  return perId.get(id) ?? null;
}

export function alleEuropaVragen() {
  return [...perId.values()];
}

export function europaVragenVoorLeerdoel(leerdoelId: string) {
  return [...perId.values()].filter((v) => v.learningGoalId === leerdoelId);
}
