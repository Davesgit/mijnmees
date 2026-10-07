import { weetjes } from "@/content/weetjes";
import { dagInAmsterdam } from "@/lib/datum";
import { europaHerhaling, maakEuropaSlots, maakPuzzelSlots, type EuropaOnderwerp } from "./europa-sessie";
import { tafelVraag } from "./tafel-vragen";
import type { OpslagData, Sessie, SessieInstellingen, Slot } from "./types";
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
  /** Gasten (zonder ouderaccount) mogen zoveel oefeningen afronden; hervatten blijft altijd mogelijk. */
  maxGastAfgerond: 2,
  /** Niveaubepaling: aantal vragen (bouwvoorstel max 12). */
  niveauVragen: 8,
} as const;

export function aantalAfgerond(data: OpslagData) {
  return Object.values(data.sessies).filter((s) => s.status === "afgerond" && s.soort !== "niveau").length;
}

export function gastLimietBereikt(data: OpslagData) {
  return aantalAfgerond(data) >= oefenConfig.maxGastAfgerond;
}

const nieuwId = () => crypto.randomUUID();
const leegSlot = (v: Vraag): Slot => ({ id: nieuwId(), vraagId: v.id, vraagVersie: v.version, hulp: { hints: 0, uitleg: false, fouten: 0 } });

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

function nieuweSessie(data: OpslagData, sessie: Omit<Sessie, "id" | "index" | "versie" | "status" | "gestartOp">) {
  const volledig: Sessie = { id: nieuwId(), ...sessie, index: 0, versie: 1, status: "bezig", gestartOp: new Date().toISOString() };
  // Een nieuwe sessie voor een leerdoel neemt openstaande reviews van dat leerdoel mee.
  const leerdoelen = new Set(volledig.slots.map((s) => vindVraag(s.vraagId)?.learningGoalId ?? volledig.leerdoelId));
  const reviews = data.reviews.filter((r) => !leerdoelen.has(r.leerdoelId));
  return { data: { ...data, reviews, sessies: { ...data.sessies, [volledig.id]: volledig } }, sessie: volledig };
}

export function maakSessie(
  data: OpslagData,
  instelling: { leerdoelId: string; onderdeelId: string; onderwerpId: string; niveau: Niveau; aantal: number; bron: Sessie["bron"] },
): { data: OpslagData; sessie: Sessie } {
  const aantal = Math.min(oefenConfig.maxAantal, Math.max(oefenConfig.minAantal, instelling.aantal));
  const vragen = kiesVragen(instelling.leerdoelId, instelling.niveau, aantal);
  if (vragen.length === 0) throw new Error("Geen vragen beschikbaar voor dit onderdeel.");
  return nieuweSessie(data, { soort: "oefening", ...instelling, aantal: vragen.length, slots: vragen.map(leegSlot) });
}

/** Tafeltrainer: vragen uit de gekozen tafels, vermenigvuldigen en eventueel delen, zonder dubbele vragen. */
export function maakTafelSessie(
  data: OpslagData,
  instelling: { tafels: number[]; bewerkingen: ("x" | ":")[]; aantal: number; metTijd: boolean; bron: Sessie["bron"] },
) {
  const pool = schud(
    instelling.tafels.flatMap((t) =>
      instelling.bewerkingen.flatMap((b) =>
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((f) => tafelVraag(b === "x" ? `tafel-${t}-x-${f}` : `tafel-${t}-d-${t * f}`)),
      ),
    ).filter((v): v is NonNullable<typeof v> => v !== null),
  );
  // Liever niet steeds ×1 en ×10: die komen pas als er anders te weinig vragen zijn.
  const gesorteerd = [...pool.filter((v) => ![1, 10].includes(v.bewerking === "x" ? v.links : v.answer)), ...pool.filter((v) => [1, 10].includes(v.bewerking === "x" ? v.links : v.answer))];
  const aantal = Math.min(oefenConfig.maxAantal, Math.max(oefenConfig.minAantal, instelling.aantal));
  const vragen = gesorteerd.slice(0, aantal);
  if (vragen.length === 0) throw new Error("Kies eerst een tafel.");
  return nieuweSessie(data, {
    soort: "tafels",
    instellingen: { tafels: instelling.tafels, bewerkingen: instelling.bewerkingen, metTijd: instelling.metTijd },
    leerdoelId: "tafels",
    onderdeelId: "tafels",
    onderwerpId: "tafels",
    niveau: "past-bij-mij",
    aantal: vragen.length,
    bron: instelling.bron,
    slots: schud(vragen).map(leegSlot),
  });
}

/** Europa: de hele selectie (landen × onderwerpen), of de landenpuzzel. */
export function maakEuropaSessie(
  data: OpslagData,
  instelling: { gebieden: string[]; landen: string[]; onderwerpen: EuropaOnderwerp[]; vorm: "afwisselend" | "puzzel" },
) {
  const slots = instelling.vorm === "puzzel" ? maakPuzzelSlots(instelling.landen) : maakEuropaSlots(instelling.landen, instelling.onderwerpen);
  if (slots.length === 0) throw new Error("Kies een gebied en een onderwerp.");
  return nieuweSessie(data, {
    soort: instelling.vorm === "puzzel" ? "puzzel" : "europa",
    instellingen: { gebieden: instelling.gebieden, landen: instelling.landen, onderwerpen: instelling.onderwerpen },
    leerdoelId: instelling.vorm === "puzzel" ? "europa-landen" : "europa",
    onderdeelId: "europa",
    onderwerpId: "aardrijkskunde",
    niveau: "past-bij-mij",
    aantal: slots.length,
    bron: "zelf",
    slots,
  });
}

// ---------- Niveaubepaling ----------

export const niveauGebieden = {
  breuken: { naam: "Breuken", onderdeelNaam: "Breuken vergelijken", leerdoelId: "breuken-vergelijken", onderdeelId: "breuken-vergelijken", onderwerpId: "breuken" },
  tafels: { naam: "Tafels", onderdeelNaam: "Tafels", leerdoelId: "tafels", onderdeelId: "tafels", onderwerpId: "tafels" },
} as const;
export type NiveauGebied = keyof typeof niveauGebieden;

export const tafelsPerNiveau: Record<Niveau, number[]> = {
  makkelijk: [1, 2, 5, 10],
  "past-bij-mij": [3, 4, 6, 8, 9],
  uitdagend: [7, 11, 12],
};
const niveaus: Niveau[] = ["makkelijk", "past-bij-mij", "uitdagend"];

export function niveauVanVraag(vraag: Vraag): Niveau {
  if (vraag.soort === "tafel") return niveaus.find((n) => tafelsPerNiveau[n].includes(vraag.tafel)) ?? "past-bij-mij";
  return vraag.difficulty;
}

function niveauVraag(gebied: NiveauGebied, niveau: Niveau, gebruikt: Set<string>): Vraag | null {
  if (gebied === "breuken") {
    return schud(vragenVoorLeerdoel("breuken-vergelijken").filter((v) => v.difficulty === niveau && !gebruikt.has(v.id)))[0] ?? null;
  }
  const kandidaten = tafelsPerNiveau[niveau].flatMap((t) => [2, 3, 4, 6, 7, 8, 9].map((f) => tafelVraag(`tafel-${t}-x-${f}`)));
  return schud(kandidaten.filter((v): v is NonNullable<typeof v> => v !== null && !gebruikt.has(v.id)))[0] ?? null;
}

export function maakNiveauSessie(data: OpslagData, gebied: NiveauGebied) {
  const g = niveauGebieden[gebied];
  // Twee ankervragen op het middelste niveau.
  const eerste = niveauVraag(gebied, "past-bij-mij", new Set());
  const tweede = eerste ? niveauVraag(gebied, "past-bij-mij", new Set([eerste.id])) : null;
  if (!eerste || !tweede) throw new Error("Er staat geen vraag klaar.");
  return nieuweSessie(data, {
    soort: "niveau",
    instellingen: { niveauGebied: gebied },
    leerdoelId: g.leerdoelId,
    onderdeelId: g.onderdeelId,
    onderwerpId: g.onderwerpId,
    niveau: "past-bij-mij",
    aantal: oefenConfig.niveauVragen,
    bron: "zelf",
    slots: [leegSlot(eerste), leegSlot(tweede)],
  });
}

/** Na een afgehandelde vraag: zelfstandig goed → een stap moeilijker, anders een stap makkelijker. */
function volgendeNiveauSlot(sessie: Sessie): Sessie {
  if (sessie.slots.length >= sessie.aantal || sessie.index + 1 < sessie.slots.length) return sessie;
  const laatste = sessie.slots[sessie.index];
  const vraag = vindVraag(laatste.vraagId);
  if (!vraag) return sessie;
  const huidig = niveaus.indexOf(niveauVanVraag(vraag));
  const stap = laatste.uitkomst === "zelfstandig" ? 1 : -1;
  const doel = niveaus[Math.min(2, Math.max(0, huidig + stap))];
  const gebied = (sessie.instellingen?.niveauGebied ?? "breuken") as NiveauGebied;
  const gebruikt = new Set(sessie.slots.map((s) => s.vraagId));
  const volgende = niveauVraag(gebied, doel, gebruikt) ?? niveauVraag(gebied, niveaus[huidig], gebruikt);
  return volgende ? { ...sessie, slots: [...sessie.slots, leegSlot(volgende)], aantal: sessie.aantal } : { ...sessie, aantal: sessie.slots.length };
}

export type NiveauAdvies = { gebied: NiveauGebied; niveau: Niveau; zeker: boolean; zelfstandig: number; gemaakt: number };

/** Voorzichtig beginadvies: hoogste niveau met minstens twee zelfstandige antwoorden en een ruime meerderheid goed. */
export function niveauAdvies(sessie: Sessie): NiveauAdvies {
  const gebied = (sessie.instellingen?.niveauGebied ?? "breuken") as NiveauGebied;
  const perNiveau = new Map<Niveau, { goed: number; totaal: number }>();
  let zelfstandig = 0;
  let gemaakt = 0;
  for (const slot of sessie.slots) {
    const vraag = vindVraag(slot.vraagId);
    if (!vraag || !slot.uitkomst) continue;
    gemaakt++;
    const n = niveauVanVraag(vraag);
    const stand = perNiveau.get(n) ?? { goed: 0, totaal: 0 };
    stand.totaal++;
    if (slot.uitkomst === "zelfstandig") {
      stand.goed++;
      zelfstandig++;
    }
    perNiveau.set(n, stand);
  }
  const passend = [...niveaus].reverse().find((n) => {
    const s = perNiveau.get(n);
    return s && s.goed >= 2 && s.goed / s.totaal >= 2 / 3;
  });
  return { gebied, niveau: passend ?? "makkelijk", zeker: Boolean(passend) && zelfstandig >= 2, zelfstandig, gemaakt };
}

// ---------- Antwoorden, hulp en verder ----------

function vervangSlot(sessie: Sessie, index: number, slot: Slot): Sessie {
  const slots = [...sessie.slots];
  slots[index] = slot;
  return { ...sessie, slots, versie: sessie.versie + 1 };
}

/**
 * Plant na hulp een soortgelijke vraag over hetzelfde leerdoel.
 * Oefening/tafels: vervangt een nog niet getoonde vraagplaats (geen extra plaatsen), anders een review-item.
 * Europa: voegt één herhaling per object in, drie plaatsen later. Niveaubepaling en puzzel: geen vervolg.
 */
function planVervolg(data: OpslagData, sessie: Sessie, index: number): { data: OpslagData; sessie: Sessie } {
  const oorsprong = sessie.slots[index];
  if (oorsprong.herhalingVan || oorsprong.vervolgGepland || sessie.soort === "niveau" || sessie.soort === "puzzel") return { data, sessie };

  if (sessie.soort === "europa") {
    const herhaling = europaHerhaling(oorsprong, sessie.instellingen?.landen ?? []);
    let bijgewerkt = vervangSlot(sessie, index, { ...oorsprong, vervolgGepland: true });
    if (herhaling) {
      const slots = [...bijgewerkt.slots];
      slots.splice(Math.min(index + oefenConfig.vervolgAfstand + 1, slots.length), 0, herhaling);
      bijgewerkt = { ...bijgewerkt, slots };
    }
    return { data, sessie: bijgewerkt };
  }

  const origineel = vindVraag(oorsprong.vraagId);
  const leerdoel = origineel?.learningGoalId ?? sessie.leerdoelId;
  const gebruikt = new Set(sessie.slots.map((s) => s.vraagId));
  const kandidaten = schud(vragenVoorLeerdoel(leerdoel).filter((v) => !gebruikt.has(v.id)));
  const vervanger = kandidaten.find((v) => v.difficulty === origineel?.difficulty) ?? kandidaten[0];

  const doelIndex = [index + oefenConfig.vervolgAfstand, index + 2].find(
    (i) => i < sessie.slots.length && !sessie.slots[i].herhalingVan && !sessie.slots[i].uitkomst,
  );

  if (!vervanger || doelIndex === undefined) {
    const review = { leerdoelId: leerdoel, vanSessieId: sessie.id, op: new Date().toISOString() };
    const bestaat = data.reviews.some((r) => r.leerdoelId === leerdoel);
    const gemarkeerd = vervangSlot(sessie, index, { ...oorsprong, vervolgGepland: true });
    return { data: bestaat ? data : { ...data, reviews: [...data.reviews, review] }, sessie: gemarkeerd };
  }

  let bijgewerkt = vervangSlot(sessie, index, { ...oorsprong, vervolgGepland: true });
  bijgewerkt = vervangSlot(bijgewerkt, doelIndex, { ...leegSlot(vervanger), herhalingVan: oorsprong.id });
  return { data, sessie: bijgewerkt };
}

function metSessie(data: OpslagData, sessie: Sessie): OpslagData {
  return { ...data, sessies: { ...data.sessies, [sessie.id]: sessie } };
}

export type Beoordeling = "goed" | "fout";

/**
 * Beoordeelt een antwoord op de huidige vraagplaats, of op een gegeven vraagplaats (puzzel: elk stukje mag).
 * Hulpladder: 2e fout → hint 1, 3e fout → hint 2, 4e fout → uitleg.
 */
export function registreerAntwoord(
  data: OpslagData,
  sessieId: string,
  antwoord: string,
  opties: { slotId?: string; actieveDuurMs?: number } = {},
): { data: OpslagData; beoordeling: Beoordeling } | null {
  const sessie = data.sessies[sessieId];
  if (!sessie || sessie.status !== "bezig") return null;
  const index = opties.slotId ? sessie.slots.findIndex((s) => s.id === opties.slotId) : sessie.index;
  const slot = sessie.slots[index];
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
    leerdoelId: vraag.learningGoalId,
    antwoord,
    resultaat: goed ? ("goed" as const) : ("fout" as const),
    eerstePoging: slot.hulp.fouten === 0,
    hulpVooraf: { hints: slot.hulp.hints, uitleg: slot.hulp.uitleg },
    ...(opties.actieveDuurMs !== undefined ? { actieveDuurMs: Math.round(opties.actieveDuurMs) } : {}),
    op: new Date().toISOString(),
  };

  let nieuwSlot: Slot;
  if (goed) {
    const zelfstandig = slot.hulp.fouten === 0 && slot.hulp.hints === 0;
    nieuwSlot = { ...slot, antwoord, uitkomst: zelfstandig ? "zelfstandig" : "met-hulp" };
  } else {
    const fouten = slot.hulp.fouten + 1;
    const hints = Math.max(slot.hulp.hints, fouten >= 3 ? 2 : fouten >= 2 ? 1 : 0) as 0 | 1 | 2;
    nieuwSlot = { ...slot, antwoord, hulp: { hints, fouten, uitleg: fouten >= 4 } };
  }

  let bijgewerkt = vervangSlot(sessie, index, nieuwSlot);
  let nieuweData: OpslagData = { ...data, pogingen: [...data.pogingen, poging] };
  if (goed && nieuwSlot.uitkomst === "met-hulp") {
    ({ data: nieuweData, sessie: bijgewerkt } = planVervolg(nieuweData, bijgewerkt, index));
  }
  return { data: metSessie(nieuweData, bijgewerkt), beoordeling: goed ? "goed" : "fout" };
}

/** Handmatig hulp vragen: hint 1 → hint 2 → uitleg. */
export function vraagHulp(data: OpslagData, sessieId: string, slotId?: string): OpslagData {
  const sessie = data.sessies[sessieId];
  if (!sessie || sessie.status !== "bezig") return data;
  const index = slotId ? sessie.slots.findIndex((s) => s.id === slotId) : sessie.index;
  const slot = sessie.slots[index];
  if (!slot || slot.uitkomst || slot.hulp.uitleg) return data;
  const hulp = slot.hulp.hints < 2 ? { ...slot.hulp, hints: (slot.hulp.hints + 1) as 1 | 2 } : { ...slot.hulp, uitleg: true };
  return metSessie(data, vervangSlot(sessie, index, { ...slot, hulp }));
}

function rondAf(data: OpslagData, sessie: Sessie): OpslagData {
  const afgerond: Sessie = { ...sessie, index: sessie.slots.length, status: "afgerond", afgerondOp: new Date().toISOString(), versie: sessie.versie + 1 };
  // De niveaubepaling is geen oefening: geen weetje.
  return sessie.soort === "niveau" ? metSessie(data, afgerond) : ontdekWeetje(metSessie(data, afgerond), afgerond.id);
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
  if (sessie.soort === "niveau") sessie = volgendeNiveauSlot(sessie);

  const index = sessie.index + 1;
  if (index < sessie.slots.length) return metSessie(nieuweData, { ...sessie, index, versie: sessie.versie + 1 });
  return rondAf(nieuweData, sessie);
}

/** Puzzel: een stukje met uitleg op zijn plek leggen. Klaar als alle stukjes liggen. */
export function legPuzzelstukNaUitleg(data: OpslagData, sessieId: string, slotId: string): OpslagData {
  const sessie = data.sessies[sessieId];
  if (!sessie || sessie.status !== "bezig") return data;
  const index = sessie.slots.findIndex((s) => s.id === slotId);
  const slot = sessie.slots[index];
  if (!slot || slot.uitkomst || !slot.hulp.uitleg) return data;
  return metSessie(data, vervangSlot(sessie, index, { ...slot, uitkomst: "met-uitleg" }));
}

/** Puzzel: afronden zodra alle stukjes liggen; index = aantal gelegde stukjes. */
export function werkPuzzelBij(data: OpslagData, sessieId: string): OpslagData {
  const sessie = data.sessies[sessieId];
  if (!sessie || sessie.status !== "bezig" || sessie.soort !== "puzzel") return data;
  const gelegd = sessie.slots.filter((s) => s.uitkomst).length;
  if (gelegd === sessie.slots.length) return rondAf(data, sessie);
  return gelegd === sessie.index ? data : metSessie(data, { ...sessie, index: gelegd, versie: sessie.versie + 1 });
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
  if (!sessie || sessie.status !== "bezig" || sessie.soort === "puzzel") return data;
  const slot = sessie.slots[sessie.index];
  return slot?.uitkomst ? gaVerder(data, sessieId) : data;
}

export function openSessie(data: OpslagData): Sessie | null {
  const open = Object.values(data.sessies)
    .filter((s) => s.status === "bezig" && s.soort !== "niveau")
    .sort((a, b) => b.gestartOp.localeCompare(a.gestartOp));
  return open[0] ?? null;
}

export function sessieStatistiek(sessie: Sessie) {
  const telt = sessie.slots.filter((s) => !s.herhalingVan || sessie.soort !== "europa");
  const zelfstandig = telt.filter((s) => s.uitkomst === "zelfstandig").length;
  const afgehandeld = telt.filter((s) => s.uitkomst).length;
  return { zelfstandig, afgehandeld, aantal: telt.length };
}

/** Route naar de juiste oefenpagina voor een sessie. */
export function sessieRoute(sessie: Sessie) {
  if (sessie.status === "afgerond") return sessie.soort === "niveau" ? `/kind/niveaubepaling/advies?sessie=${sessie.id}` : `/kind/oefening/${sessie.id}/afgerond`;
  switch (sessie.soort) {
    case "tafels":
      return `/kind/tafeltrainer/${sessie.id}`;
    case "europa":
    case "puzzel":
      return `/kind/aardrijkskunde/europa/${sessie.id}`;
    case "niveau":
      return `/kind/niveaubepaling/${sessie.id}`;
    default:
      return `/kind/oefenen/${sessie.id}`;
  }
}

export type { SessieInstellingen };
