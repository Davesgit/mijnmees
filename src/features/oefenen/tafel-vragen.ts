// Tafelvragen worden uit hun id afgeleid, zodat client en server dezelfde vraag en hetzelfde antwoord kennen.
// Vermenigvuldigen: "tafel-7-x-8" = 8 × 7. Delen: "tafel-7-d-56" = 56 : 7.

export type TafelVraag = {
  soort: "tafel";
  id: string;
  version: 1;
  learningGoalId: string;
  difficulty: "past-bij-mij";
  tafel: number;
  bewerking: "x" | ":";
  links: number;
  rechts: number;
  prompt: string;
  instructie: string;
  answer: number;
  hints: [string, string];
  explanation: string;
};

export const TAFELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const FACTOREN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function stappen(n: number, tot: number) {
  return Array.from({ length: tot }, (_, i) => (i + 1) * n).join(", ");
}

function maakVermenigvuldiging(tafel: number, factor: number): TafelVraag {
  const uitkomst = factor * tafel;
  const anker = factor > 5 ? 5 : factor > 2 ? 2 : 1;
  const hint1 =
    factor === 1
      ? `1 keer een getal is dat getal zelf.`
      : factor === 10
        ? `Bij keer 10 zet je een 0 achter het getal.`
        : `Je weet vast ${anker} × ${tafel} = ${anker * tafel}. Tel er nog ${factor - anker} × ${tafel} bij.`;
  return {
    soort: "tafel",
    id: `tafel-${tafel}-x-${factor}`,
    version: 1,
    learningGoalId: `tafel-${tafel}`,
    difficulty: "past-bij-mij",
    tafel,
    bewerking: "x",
    links: factor,
    rechts: tafel,
    prompt: `Wat is ${factor} × ${tafel}?`,
    instructie: "Vul het antwoord in.",
    answer: uitkomst,
    hints: [hint1, `Tel in stappen van ${tafel}: ${stappen(tafel, Math.min(factor - 1, 9)) || "begin bij 0"}, …`],
    explanation: `${factor} × ${tafel} = ${uitkomst}. Je telt ${factor} keer ${tafel}.`,
  };
}

function maakDeling(tafel: number, factor: number): TafelVraag {
  const deeltal = factor * tafel;
  return {
    soort: "tafel",
    id: `tafel-${tafel}-d-${deeltal}`,
    version: 1,
    learningGoalId: `deeltafel-${tafel}`,
    difficulty: "past-bij-mij",
    tafel,
    bewerking: ":",
    links: deeltal,
    rechts: tafel,
    prompt: `Wat is ${deeltal} : ${tafel}?`,
    instructie: "Vul het antwoord in.",
    answer: factor,
    hints: [`Hoe vaak past ${tafel} in ${deeltal}?`, `Welk getal keer ${tafel} is ${deeltal}? Zoek het in de tafel van ${tafel}.`],
    explanation: `${factor} × ${tafel} = ${deeltal}. Dus ${deeltal} : ${tafel} = ${factor}.`,
  };
}

export function tafelVraag(id: string): TafelVraag | null {
  const m = id.match(/^tafel-(\d+)-(x|d)-(\d+)$/);
  if (!m) return null;
  const tafel = Number(m[1]);
  const waarde = Number(m[3]);
  if (!TAFELS.includes(tafel as (typeof TAFELS)[number])) return null;
  if (m[2] === "x") return FACTOREN.includes(waarde) ? maakVermenigvuldiging(tafel, waarde) : null;
  const factor = waarde / tafel;
  return Number.isInteger(factor) && FACTOREN.includes(factor) ? maakDeling(tafel, factor) : null;
}

export function tafelVragenVoorLeerdoel(leerdoelId: string): TafelVraag[] {
  const m = leerdoelId.match(/^(tafel|deeltafel)-(\d+)$/);
  if (!m) return [];
  const tafel = Number(m[2]);
  if (!TAFELS.includes(tafel as (typeof TAFELS)[number])) return [];
  return FACTOREN.map((f) => (m[1] === "tafel" ? maakVermenigvuldiging(tafel, f) : maakDeling(tafel, f)));
}
