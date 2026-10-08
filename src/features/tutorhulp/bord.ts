// Het tekenbord als data: elementen plus een tijdlijn van gebeurtenissen. Geen afbeeldingen of HTML,
// zodat de uitleg veilig opnieuw af te spelen is en synchroon loopt met de opgenomen stem.

export const BORD = { breedte: 1000, hoogte: 625 } as const;

export const bordKleuren = {
  inkt: "#111d55",
  blauw: "#005fcc",
  oranje: "#c2410c",
  groen: "#166534",
} as const;
export type BordKleur = keyof typeof bordKleuren;

type Basis = { id: string; kleur: BordKleur };
export type TekstElement = Basis & { soort: "tekst"; x: number; y: number; tekst: string; groot: boolean };
export type BreukElement = Basis & { soort: "breuk"; x: number; y: number; teller: string; noemer: string };
/** Rechthoek en cirkel kunnen in gelijke delen verdeeld zijn, met een aantal gekleurde delen (breukmodel). */
export type RechthoekElement = Basis & { soort: "rechthoek"; x: number; y: number; b: number; h: number; delen: number; gevuld: number };
export type CirkelElement = Basis & { soort: "cirkel"; x: number; y: number; r: number; delen: number; gevuld: number };
export type PijlElement = Basis & { soort: "pijl"; x1: number; y1: number; x2: number; y2: number };
export type PenElement = Basis & { soort: "pen"; punten: [number, number][] };

export type BordElement = TekstElement | BreukElement | RechthoekElement | CirkelElement | PijlElement | PenElement;

/** plaats = toevoegen of vervangen (op id); zet = hele bord in één keer (ongedaan maken, wissen). */
export type BordGebeurtenis =
  | { t: number; op: "plaats"; element: BordElement }
  | { t: number; op: "verwijder"; id: string }
  | { t: number; op: "zet"; elementen: BordElement[] };

export type BordOpname = { elementen: BordElement[]; gebeurtenissen: BordGebeurtenis[] };

export const bordLimieten = { elementen: 300, gebeurtenissen: 10000, penPunten: 600, tekst: 120 } as const;

export function pasGebeurtenisToe(elementen: BordElement[], g: BordGebeurtenis): BordElement[] {
  switch (g.op) {
    case "plaats": {
      const i = elementen.findIndex((e) => e.id === g.element.id);
      if (i === -1) return [...elementen, g.element];
      const kopie = elementen.slice();
      kopie[i] = g.element;
      return kopie;
    }
    case "verwijder":
      return elementen.filter((e) => e.id !== g.id);
    case "zet":
      return g.elementen;
  }
}

/** Het bord zoals het er op tijdstip t (ms) uitzag. */
export function bordOp(opname: BordOpname, t: number): BordElement[] {
  let elementen = opname.elementen;
  for (const g of opname.gebeurtenissen) {
    if (g.t > t) break;
    elementen = pasGebeurtenisToe(elementen, g);
  }
  return elementen;
}

/** Eindtoestand (voor een stilstaand voorbeeld). */
export const bordEind = (opname: BordOpname) => bordOp(opname, Number.POSITIVE_INFINITY);

export const nieuwElementId = () => Math.random().toString(36).slice(2, 10);

/** Grens van een element, voor selecteren en verplaatsen. */
export function verschuif(e: BordElement, dx: number, dy: number): BordElement {
  const k = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v)));
  switch (e.soort) {
    case "pijl":
      return { ...e, x1: k(e.x1 + dx, BORD.breedte), y1: k(e.y1 + dy, BORD.hoogte), x2: k(e.x2 + dx, BORD.breedte), y2: k(e.y2 + dy, BORD.hoogte) };
    case "pen":
      return { ...e, punten: e.punten.map(([x, y]) => [k(x + dx, BORD.breedte), k(y + dy, BORD.hoogte)]) };
    default:
      return { ...e, x: k(e.x + dx, BORD.breedte), y: k(e.y + dy, BORD.hoogte) };
  }
}

/** Leesbare omschrijving per element (schermlezer en toetsenbordbediening). */
export function omschrijf(e: BordElement) {
  switch (e.soort) {
    case "tekst":
      return `Tekst: ${e.tekst}`;
    case "breuk":
      return `Breuk ${e.teller}/${e.noemer}`;
    case "rechthoek":
      return e.delen > 1 ? `Strook in ${e.delen} delen, ${e.gevuld} gekleurd` : "Rechthoek";
    case "cirkel":
      return e.delen > 1 ? `Cirkel in ${e.delen} delen, ${e.gevuld} gekleurd` : "Cirkel";
    case "pijl":
      return "Pijl";
    case "pen":
      return "Tekening";
  }
}
