import kaartData from "@/content/europa/kaart.json";

// Kaartgegevens (Natural Earth v5.1.2, publiek domein). Alleen geïmporteerd door de Europa-pagina's.

export type Bbox = [number, number, number, number];

export type KaartLand = { id: string; naam: string; kleur: string; pad: string; bbox: Bbox; midden: [number, number] };
export type KaartObject = { id: string; naam: string; pad: string; bbox?: Bbox; midden?: [number, number]; landen?: string[] };
export type Hoofdstad = { id: string; land: string; naam: string; x: number; y: number };

export const kaart = kaartData as unknown as {
  viewBox: [number, number, number, number];
  context: string[];
  meren: string[];
  landen: KaartLand[];
  hoofdsteden: Hoofdstad[];
  wateren: KaartObject[];
  rivieren: KaartObject[];
  gebergten: KaartObject[];
};

// Eigen kleurverdeling: landen waarvan de omhullende kaders elkaar raken, krijgen nooit dezelfde kleur
// (strenger dan echte buren, dus buurlanden verschillen altijd). Grootste landen eerst.
const palet = ["#fbe39a", "#dcc6f2", "#bde3b2", "#fbc8a2", "#a8d9e6", "#f5b9c9", "#c3c7f1", "#e8d5b0", "#b6e0d0"];
const raakt = (a: Bbox, b: Bbox) => a[0] - 2 <= b[2] && b[0] - 2 <= a[2] && a[1] - 2 <= b[3] && b[1] - 2 <= a[3];
const opGrootte = [...kaart.landen].sort((a, b) => (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) - (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]));
const gekleurd: KaartLand[] = [];
for (const land of opGrootte) {
  const bezet = new Set(gekleurd.filter((g) => raakt(g.bbox, land.bbox)).map((g) => g.kleur));
  land.kleur = palet.find((k) => !bezet.has(k)) ?? palet[gekleurd.length % palet.length];
  gekleurd.push(land);
}

export const landPerId = new Map(kaart.landen.map((l) => [l.id, l]));

/** Kleine landen (microstaten) krijgen een neutrale stip met een groter aantikvlak. */
export function isKleinLand(land: KaartLand) {
  const [x1, y1, x2, y2] = land.bbox;
  return x2 - x1 < 9 && y2 - y1 < 9;
}

/** Zo klein dat een kleur alleen niet opvalt (microstaten en Luxemburg): dan een ring erbij. */
export function heeftRingNodig(land: KaartLand) {
  const [x1, y1, x2, y2] = land.bbox;
  return Math.max(x2 - x1, y2 - y1) < 15;
}

/** Omhullend kader van een aantal landen, met wat ruimte eromheen. */
export function kaderVoorLanden(ids: string[], marge = 0.06): [number, number, number, number] {
  const kaders = ids.map((id) => landPerId.get(id)?.bbox).filter((b): b is Bbox => Boolean(b));
  if (kaders.length === 0) return kaart.viewBox;
  let [x1, y1, x2, y2] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [a, b, c, d] of kaders) {
    x1 = Math.min(x1, a);
    y1 = Math.min(y1, b);
    x2 = Math.max(x2, c);
    y2 = Math.max(y2, d);
  }
  const w = x2 - x1;
  const h = y2 - y1;
  const mx = Math.max(w * marge, 12);
  const my = Math.max(h * marge, 12);
  return [x1 - mx, y1 - my, w + 2 * mx, h + 2 * my];
}

/** Omzetten van een landpad naar een eigen viewBox (voor puzzelstukjes). */
export function viewBoxVan(bbox: Bbox) {
  const [x1, y1, x2, y2] = bbox;
  const m = Math.max(x2 - x1, y2 - y1) * 0.06;
  return `${x1 - m} ${y1 - m} ${x2 - x1 + 2 * m} ${y2 - y1 + 2 * m}`;
}
