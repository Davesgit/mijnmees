import type { Poging, Sessie, SlotUitkomst } from "@/features/oefenen/types";
import { vragenVoorLeerdoel, type Vraag } from "@/features/oefenen/vragen";

/**
 * Wanneer kan een menselijke tutor passend zijn? Beginvoorstel uit de overdracht (geen diagnose):
 * op twee verschillende oefendagen vastgelopen tot en met de uitleg, én een soortgelijke vervolgvraag lukte niet zelfstandig.
 * De basisroute (tussenstap) ontbreekt nog in de content; dat staat eerlijk in het bewijs.
 */
export const tutorCriteria = {
  versie: 1,
  minDagen: 2,
  periodeDagen: 30,
  /** Zoveel dagen blijft een hulpvraag van één tutor voordat een ander hem mag oppakken. */
  claimDagen: 5,
} as const;

/** Tutorhulp bestaat (voorlopig) voor rekenleerdoelen: breuken en tafels. */
export function tutorhulpMogelijk(leerdoelId: string) {
  if (leerdoelId.startsWith("europa-")) return false;
  return vragenVoorLeerdoel(leerdoelId).length > 0;
}

export type VastgelopenSlot = { sessieId: string; slotId: string; vraagId: string; dag: string; uitkomst: SlotUitkomst; vervolg: boolean };

export type HulpBewijs = {
  leerdoelId: string;
  criteriaVersie: number;
  dagen: string[];
  vastgelopen: VastgelopenSlot[];
  /** Vervolgvragen (soortgelijke vraag) die niet zelfstandig lukten. */
  vervolgNietZelfstandig: number;
  eventIds: string[];
  basisroute: "niet-beschikbaar";
};

export type Geschiktheid = { geschikt: boolean; bewijs: HulpBewijs; ontbreekt: string[] };

const dagFormaat = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" });
export const amsterdamseDag = (iso: string) => dagFormaat.format(new Date(iso));

export function beoordeelTutorhulp(data: { sessies: Sessie[]; pogingen: Poging[] }, leerdoelId: string, nu = new Date()): Geschiktheid {
  const vanaf = nu.getTime() - tutorCriteria.periodeDagen * 86_400_000;
  const pogingenPerSlot = new Map<string, Poging[]>();
  for (const p of data.pogingen) {
    if (p.leerdoelId !== leerdoelId || Date.parse(p.op) < vanaf) continue;
    const sleutel = `${p.sessieId}:${p.slotId}`;
    pogingenPerSlot.set(sleutel, [...(pogingenPerSlot.get(sleutel) ?? []), p]);
  }

  const vastgelopen: VastgelopenSlot[] = [];
  const eventIds: string[] = [];
  let vervolgNietZelfstandig = 0;
  for (const sessie of data.sessies) {
    if (sessie.soort === "niveau" || sessie.soort === "controle") continue;
    for (const slot of sessie.slots) {
      const pogingen = pogingenPerSlot.get(`${sessie.id}:${slot.id}`);
      if (!pogingen?.length || !slot.uitkomst) continue;
      const vervolg = Boolean(slot.herhalingVan);
      if (vervolg && slot.uitkomst !== "zelfstandig") vervolgNietZelfstandig++;
      if (slot.uitkomst === "met-uitleg" || (vervolg && slot.uitkomst !== "zelfstandig")) {
        vastgelopen.push({ sessieId: sessie.id, slotId: slot.id, vraagId: slot.vraagId, dag: amsterdamseDag(pogingen.at(-1)!.op), uitkomst: slot.uitkomst, vervolg });
        eventIds.push(...pogingen.map((p) => p.eventId));
      }
    }
  }

  const dagen = [...new Set(vastgelopen.filter((v) => v.uitkomst === "met-uitleg").map((v) => v.dag))].sort();
  const ontbreekt: string[] = [];
  if (!tutorhulpMogelijk(leerdoelId)) ontbreekt.push("Voor dit onderdeel is nog geen tutorhulp.");
  if (dagen.length < tutorCriteria.minDagen) ontbreekt.push("Oefen dit onderdeel op nog een andere dag, met de hints en de uitleg.");
  if (vervolgNietZelfstandig < 1) ontbreekt.push("Probeer eerst een soortgelijke vraag na de uitleg.");

  return {
    geschikt: ontbreekt.length === 0,
    ontbreekt,
    bewijs: { leerdoelId, criteriaVersie: tutorCriteria.versie, dagen, vastgelopen: vastgelopen.slice(-12), vervolgNietZelfstandig, eventIds: eventIds.slice(-60), basisroute: "niet-beschikbaar" },
  };
}

/** Alle leerdoelen waarvoor tutorhulp nu passend is. */
export function geschikteLeerdoelen(data: { sessies: Sessie[]; pogingen: Poging[] }, nu = new Date()) {
  const leerdoelen = new Set(data.pogingen.map((p) => p.leerdoelId).filter(tutorhulpMogelijk));
  return [...leerdoelen].filter((l) => beoordeelTutorhulp(data, l, nu).geschikt);
}

/** Een nieuwe, soortgelijke vraag die het kind nog niet heeft gemaakt (anders de minst recente). */
export function kiesControleVraag(leerdoelId: string, gezien: Set<string>, toeval = Math.random): Vraag | null {
  const pool = vragenVoorLeerdoel(leerdoelId).filter((v) => v.soort !== "europa");
  if (pool.length === 0) return null;
  const nieuw = pool.filter((v) => !gezien.has(v.id));
  const kandidaten = nieuw.length ? nieuw : pool;
  // Bij breuken liefst niet de moeilijkste: het gaat om zelfstandig toepassen na de uitleg.
  const passend = kandidaten.filter((v) => v.soort !== "breuk" || v.difficulty !== "uitdagend");
  const keuze = passend.length ? passend : kandidaten;
  return keuze[Math.floor(toeval() * keuze.length)] ?? null;
}

/**
 * Uitkomst van de controlevraag, afgeleid uit de pogingen die de server zelf heeft nagekeken
 * (niet uit wat het apparaat over de vraagplaats zegt).
 */
export function controleUitkomst(sessies: Sessie[], pogingen: Poging[], hulpvraagId: string, vraagId: string): SlotUitkomst | null {
  for (const s of sessies) {
    if (s.soort !== "controle" || s.instellingen?.controleVoor !== hulpvraagId) continue;
    const slot = s.slots.find((x) => x.vraagId === vraagId);
    if (!slot) continue;
    const mijn = pogingen.filter((p) => p.sessieId === s.id && p.slotId === slot.id).sort((a, b) => a.op.localeCompare(b.op));
    const goed = mijn.find((p) => p.resultaat === "goed");
    if (!goed) continue;
    if (goed.hulpVooraf.uitleg) return "met-uitleg";
    return goed.hulpVooraf.hints > 0 || mijn[0] !== goed ? "met-hulp" : "zelfstandig";
  }
  return null;
}

