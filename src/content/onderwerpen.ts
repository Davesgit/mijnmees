import type { IcoonNaam } from "@/components/mees/iconen";

export type Onderdeel = {
  id: string;
  naam: string;
  /** Korte omschrijving voor voorstel- en instelschermen. */
  omschrijving: string;
  /** Leerdoel waar de vragen aan gekoppeld zijn. Zonder leerdoel: nog geen oefeningen. */
  leerdoelId: string | null;
  pictogram: "herkennen" | "getallenlijn" | "vergelijken" | "gelijk" | "rekenen";
};

export type Onderwerp = {
  id: string;
  naam: string;
  icoon: IcoonNaam;
  /** Route-afwijking, bijvoorbeeld de tafeltrainer. */
  eigenRoute?: string;
  beschikbaar: boolean;
  onderdelen: Onderdeel[];
};

// Onderwerpen volgen data/vakken-en-doelen.json uit de overdracht.
export const rekenOnderwerpen: Onderwerp[] = [
  { id: "tafels", naam: "Tafels", icoon: "tafels", eigenRoute: "/kind/tafeltrainer", beschikbaar: false, onderdelen: [] },
  {
    id: "breuken",
    naam: "Breuken",
    icoon: "breuken",
    beschikbaar: true,
    onderdelen: [
      { id: "breuken-herkennen", naam: "Breuken herkennen", omschrijving: "Zie welk deel gekleurd is.", leerdoelId: null, pictogram: "herkennen" },
      { id: "breuken-vergelijken", naam: "Breuken vergelijken", omschrijving: "Oefen welke breuk groter is.", leerdoelId: "breuken-vergelijken", pictogram: "vergelijken" },
      { id: "gelijkwaardige-breuken", naam: "Gelijkwaardige breuken", omschrijving: "Dezelfde breuk, anders geschreven.", leerdoelId: null, pictogram: "gelijk" },
      { id: "rekenen-met-breuken", naam: "Rekenen met breuken", omschrijving: "Breuken optellen en aftrekken.", leerdoelId: null, pictogram: "rekenen" },
    ],
  },
  { id: "kommagetallen", naam: "Kommagetallen", icoon: "kommagetallen", beschikbaar: false, onderdelen: [] },
  { id: "procenten", naam: "Procenten", icoon: "procenten", beschikbaar: false, onderdelen: [] },
  { id: "meten", naam: "Meten", icoon: "meten", beschikbaar: false, onderdelen: [] },
  { id: "tijd-en-geld", naam: "Tijd en geld", icoon: "tijd", beschikbaar: false, onderdelen: [] },
];

export function vindOnderwerp(id: string) {
  return rekenOnderwerpen.find((o) => o.id === id) ?? null;
}

export function vindOnderdeel(id: string) {
  for (const onderwerp of rekenOnderwerpen) {
    const onderdeel = onderwerp.onderdelen.find((o) => o.id === id);
    if (onderdeel) return { onderwerp, onderdeel };
  }
  return null;
}

export function vindOnderdeelBijLeerdoel(leerdoelId: string) {
  for (const onderwerp of rekenOnderwerpen) {
    const onderdeel = onderwerp.onderdelen.find((o) => o.leerdoelId === leerdoelId);
    if (onderdeel) return { onderwerp, onderdeel };
  }
  return null;
}
