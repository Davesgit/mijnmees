import { weetjes } from "@/content/weetjes";
import { dagInAmsterdam } from "@/lib/datum";
import type { OpslagData, Sessie, Slot } from "./types";
import { isGoed, vindVraag, vragenVoorLeerdoel, type Niveau, type Vraag } from "./vragen";

/** Bouwvoorstellen uit besluiten-en-open-punten.md; configureerbaar. */
export const oefenConfig = {
  versie: "2026-10-08",
  standaardAantal: 8,
  minAantal: 4,
  maxAantal: 20,
  /** Minimale tijd dat "Goed gevonden!" zichtbaar is voor de automatische overgang. */
  correctOvergangMs: 900,
  /** Aantal andere vragen tussen een hulpvraag en de vervolgvraag (liefst). */
  vervolgAfstand: 3,
} as const;

const nieuwId = () => crypto.randomUUID();

function schud<T>(lijst: T[]): T[] {
  const kopie = [...lijst];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

/** Niveaus in volgorde van voorkeur wanneer één niveau te weinig vragen heeft. */
const niveauVolgorde: Record<Niveau, Niveau[]> = {
  makkelijk: ["makkelijk", "past-bij-mij", "uitdagend"],
  "past-bij-mij": ["past-bij-mij", "makkelijk", "uitdagend"],
  uitdagend: ["uitdagend", "past-bij-mij", "makkelijk"],
};

function kiesVragen(leerdoelId: string, niveau: Niveau, aantal: number): Vraag[] {
  const pool = vragenVoorLeerdoel(leerdoelId);
  const gekozen: Vraag[] = [];
  for (const n of niveauVolgorde[niveau]) {
    const extra = schud(pool.filter((v) => v.difficulty === n));
    gekozen.push(...extra.slice(0, aantal - gekozen.length));
    if (gekozen.length >= aantal) break;
  }
  return gekozen;
}

export function maakSessie(
  data: OpslagData,
  instelling: {
    leerdoelId: string;
    onderdeelId: string;
    onderwerpId: string;
    niveau: Niveau;
    aantal: number;
    bron: Sessie["bron"];
  },
): { data: OpslagData; sessie: Sessie } {
  const aantal = Math.min(oefenConfig.maxAantal, Math.max(oefenConfig.minAantal, instelling.aantal));
  const vragen = kiesVragen(instelling.leerdoelId, instelling.niveau, aantal);
  if (vragen.length === 0) throw new Error("Geen vragen beschikbaar voor dit onderdeel.");

  const sessie: Sessie = {
    id: nieuwId(),
    ...instelling,
    aantal: vragen.length,
    slots: vragen.map((v) => ({ id: nieuwId(), vraagId: v.id, vraagVersie: v.version, hulp: { hints: 0, uitleg: false, fouten: 0 } })),
    index: 0,
    versie: 1,
    status: "bezig",
    gestartOp: new Date().toISOString(),
  };

  // Een nieuwe sessie voor dit leerdoel neemt openstaande reviews mee.
  const reviews = data.reviews.filter((r) => r.leerdoelId !== instelling.leerdoelId);

  return { data: { ...data, reviews, sessies: { ...data.sessies, [sessie.id]: sessie } }, sessie };
}

function vervangSlot(sessie: Sessie, index: number, slot: Slot): Sessie {
  const slots = [...sessie.slots];
  slots[index] = slot;
  return { ...sessie, slots, versie: sessie.versie + 1 };
}

/**
 * Plant na hulp een soortgelijke vraag over hetzelfde leerdoel in een nog niet getoonde vraagplaats.
 * Eén vervolg per oorsprong, geen vervolg op een vervolg en geen extra vraagplaatsen.
 * Lukt dat niet, dan komt er een review-item voor de volgende sessie.
 */
function planVervolg(data: OpslagData, sessie: Sessie, index: number): { data: OpslagData; sessie: Sessie } {
  const oorsprong = sessie.slots[index];
  if (oorsprong.herhalingVan || oorsprong.vervolgGepland) return { data, sessie };

  const gebruikt = new Set(sessie.slots.map((s) => s.vraagId));
  const origineel = vindVraag(oorsprong.vraagId);
  const kandidaten = schud(vragenVoorLeerdoel(sessie.leerdoelId).filter((v) => !gebruikt.has(v.id)));
  const vervanger =
    kandidaten.find((v) => v.difficulty === origineel?.difficulty) ?? kandidaten[0];

  const doelIndex = [index + oefenConfig.vervolgAfstand, index + 2].find(
    (i) => i < sessie.slots.length && !sessie.slots[i].herhalingVan && !sessie.slots[i].uitkomst,
  );

  if (!vervanger || doelIndex === undefined) {
    const review = { leerdoelId: sessie.leerdoelId, vanSessieId: sessie.id, op: new Date().toISOString() };
    const bestaat = data.reviews.some((r) => r.leerdoelId === sessie.leerdoelId);
    const gemarkeerd = vervangSlot(sessie, index, { ...oorsprong, vervolgGepland: true });
    return { data: bestaat ? data : { ...data, reviews: [...data.reviews, review] }, sessie: gemarkeerd };
  }

  let bijgewerkt = vervangSlot(sessie, index, { ...oorsprong, vervolgGepland: true });
  bijgewerkt = vervangSlot(bijgewerkt, doelIndex, {
    id: nieuwId(),
    vraagId: vervanger.id,
    vraagVersie: vervanger.version,
    herhalingVan: oorsprong.id,
    hulp: { hints: 0, uitleg: false, fouten: 0 },
  });
  return { data, sessie: bijgewerkt };
}

function metSessie(data: OpslagData, sessie: Sessie): OpslagData {
  return { ...data, sessies: { ...data.sessies, [sessie.id]: sessie } };
}

export type Beoordeling = "goed" | "fout";

export function registreerAntwoord(
  data: OpslagData,
  sessieId: string,
  antwoord: string,
): { data: OpslagData; beoordeling: Beoordeling } | null {
  const sessie = data.sessies[sessieId];
  if (!sessie || sessie.status !== "bezig") return null;
  const slot = sessie.slots[sessie.index];
  if (!slot || slot.uitkomst || slot.hulp.uitleg) return null;
  const vraag = vindVraag(slot.vraagId);
  if (!vraag) return null;

  const goed = isGoed(vraag, antwoord);
  const poging = {
    eventId: nieuwId(),
    sessieId,
    slotId: slot.id,
    vraagId: vraag.id,
    vraagVersie: vraag.version,
    leerdoelId: sessie.leerdoelId,
    antwoord,
    resultaat: goed ? ("goed" as const) : ("fout" as const),
    eerstePoging: slot.hulp.fouten === 0,
    hulpVooraf: { hints: slot.hulp.hints, uitleg: slot.hulp.uitleg },
    op: new Date().toISOString(),
  };

  let nieuwSlot: Slot;
  if (goed) {
    const zelfstandig = slot.hulp.fouten === 0 && slot.hulp.hints === 0;
    nieuwSlot = { ...slot, antwoord, uitkomst: zelfstandig ? "zelfstandig" : "met-hulp" };
  } else {
    // Hulpladder: 2e fout → hint 1, 3e fout → hint 2, 4e fout → uitleg.
    const fouten = slot.hulp.fouten + 1;
    const hints = Math.max(slot.hulp.hints, fouten >= 3 ? 2 : fouten >= 2 ? 1 : 0) as 0 | 1 | 2;
    nieuwSlot = { ...slot, antwoord, hulp: { hints, fouten, uitleg: fouten >= 4 } };
  }

  let bijgewerkt = vervangSlot(sessie, sessie.index, nieuwSlot);
  let nieuweData: OpslagData = { ...data, pogingen: [...data.pogingen, poging] };
  if (goed && nieuwSlot.uitkomst === "met-hulp") {
    ({ data: nieuweData, sessie: bijgewerkt } = planVervolg(nieuweData, bijgewerkt, bijgewerkt.index));
  }
  return { data: metSessie(nieuweData, bijgewerkt), beoordeling: goed ? "goed" : "fout" };
}

/** Handmatig hulp vragen: hint 1 → hint 2 → uitleg. */
export function vraagHulp(data: OpslagData, sessieId: string): OpslagData {
  const sessie = data.sessies[sessieId];
  if (!sessie || sessie.status !== "bezig") return data;
  const slot = sessie.slots[sessie.index];
  if (!slot || slot.uitkomst || slot.hulp.uitleg) return data;
  const hulp =
    slot.hulp.hints < 2
      ? { ...slot.hulp, hints: (slot.hulp.hints + 1) as 1 | 2 }
      : { ...slot.hulp, uitleg: true };
  return metSessie(data, vervangSlot(sessie, sessie.index, { ...slot, hulp }));
}

/**
 * Gaat naar de volgende vraagplaats. Na uitleg zonder goed antwoord telt de vraagplaats als afgehandeld met uitleg.
 * Na de laatste vraagplaats wordt de sessie eenmalig afgerond.
 */
export function gaVerder(data: OpslagData, sessieId: string): OpslagData {
  let sessie = data.sessies[sessieId];
  if (!sessie || sessie.status !== "bezig") return data;
  const slot = sessie.slots[sessie.index];
  if (!slot) return data;
  if (!slot.uitkomst && !slot.hulp.uitleg) return data;

  let nieuweData = data;
  if (!slot.uitkomst) {
    sessie = vervangSlot(sessie, sessie.index, { ...slot, uitkomst: "met-uitleg" });
    ({ data: nieuweData, sessie } = planVervolg(nieuweData, sessie, sessie.index));
  }

  const index = sessie.index + 1;
  if (index < sessie.slots.length) {
    return metSessie(nieuweData, { ...sessie, index, versie: sessie.versie + 1 });
  }

  const afgerond: Sessie = { ...sessie, index: sessie.slots.length, status: "afgerond", afgerondOp: new Date().toISOString(), versie: sessie.versie + 1 };
  return ontdekWeetje(metSessie(nieuweData, afgerond), afgerond.id);
}

/** Maximaal één nieuw weetje per kalenderdag waarop een oefening is afgerond; idempotent per sessie. */
function ontdekWeetje(data: OpslagData, sessieId: string): OpslagData {
  if (data.weetjes.some((w) => w.sessieId === sessieId)) return data;
  const nu = new Date();
  const dag = dagInAmsterdam(nu);
  if (data.weetjes.some((w) => w.dag === dag)) return data;
  const ontdekt = new Set(data.weetjes.map((w) => w.weetjeId));
  const volgende = weetjes.find((w) => !ontdekt.has(w.id));
  if (!volgende) return data;
  return { ...data, weetjes: [...data.weetjes, { weetjeId: volgende.id, sessieId, dag, op: nu.toISOString() }] };
}

/** Stoppen tijdens de automatische overgang na een goed antwoord: hervat bij de volgende vraag. */
export function rondOvergangAf(data: OpslagData, sessieId: string): OpslagData {
  const sessie = data.sessies[sessieId];
  if (!sessie || sessie.status !== "bezig") return data;
  const slot = sessie.slots[sessie.index];
  return slot?.uitkomst ? gaVerder(data, sessieId) : data;
}

export function openSessie(data: OpslagData): Sessie | null {
  const open = Object.values(data.sessies)
    .filter((s) => s.status === "bezig")
    .sort((a, b) => b.gestartOp.localeCompare(a.gestartOp));
  return open[0] ?? null;
}

export function sessieStatistiek(sessie: Sessie) {
  const zelfstandig = sessie.slots.filter((s) => s.uitkomst === "zelfstandig").length;
  const afgehandeld = sessie.slots.filter((s) => s.uitkomst).length;
  return { zelfstandig, afgehandeld, aantal: sessie.slots.length };
}
