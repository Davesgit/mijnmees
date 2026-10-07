import metaData from "@/content/europa/meta.json";
import { alleEuropaVragen, europaVraag, namen, type EuropaVraag } from "./europa-vragen";
import type { Slot } from "./types";

// Samenstellen van een Europa-oefening: de hele gekozen selectie komt aan bod (geen vast aantal vragen).

export const europaMeta = metaData as {
  gebieden: { id: string; naam: string; basis: string[]; extra: string[] }[];
  fysiek: Record<string, string[]>;
  rivierLanden: Record<string, string[]>;
  wateren: string[];
  rivieren: string[];
  gebergten: string[];
  landen: string[];
};

export const europaOnderwerpen = [
  { id: "landen", naam: "Landen", icoon: "landen" },
  { id: "hoofdsteden", naam: "Hoofdsteden", icoon: "hoofdsteden" },
  { id: "wateren", naam: "Wateren", icoon: "wateren" },
  { id: "gebergten", naam: "Gebergten", icoon: "gebergten" },
  { id: "ligging", naam: "Ligging", icoon: "ligging" },
] as const;

export type EuropaOnderwerp = (typeof europaOnderwerpen)[number]["id"];

const nieuwId = () => crypto.randomUUID();

function schud<T>(lijst: T[]): T[] {
  const kopie = [...lijst];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

export function landenVanGebieden(gebieden: string[]) {
  if (gebieden.includes("heel")) return [...europaMeta.landen];
  return [...new Set(europaMeta.gebieden.filter((g) => gebieden.includes(g.id)).flatMap((g) => [...g.basis, ...g.extra]))];
}

function gebiedenVanLanden(landen: string[]) {
  return europaMeta.gebieden.filter((g) => [...g.basis, ...g.extra].some((id) => landen.includes(id))).map((g) => g.id);
}

/** Objecten per module die bij de gekozen landen horen. */
export function objectenVoorSelectie(landen: string[]) {
  const gebieden = gebiedenVanLanden(landen);
  const verwant = (id: string) => (europaMeta.fysiek[id] ?? []).some((g) => gebieden.includes(g));
  return {
    countries: landen.filter((id) => europaMeta.landen.includes(id)),
    capitals: landen.filter((id) => europaMeta.landen.includes(id)).map((id) => `${id}-capital`),
    waters: europaMeta.wateren.filter(verwant),
    rivers: europaMeta.rivieren.filter((id) => (europaMeta.rivierLanden[id] ?? []).some((l) => landen.includes(l))),
    mountains: europaMeta.gebergten.filter(verwant),
  };
}

type Objecten = ReturnType<typeof objectenVoorSelectie>;

/** Vier antwoordopties: het goede antwoord en drie andere uit dezelfde selectie. */
function maakOpties(vraag: EuropaVraag, objecten: Objecten): Slot["opties"] {
  const pool =
    vraag.id.startsWith("capital-country-") || vraag.module === "countries"
      ? objecten.countries
      : vraag.module === "capitals"
        ? objecten.capitals
        : vraag.module === "rivers"
          ? objecten.rivers
          : vraag.module === "waters"
            ? objecten.waters
            : objecten.mountains;
  const anderen = schud(pool.filter((id) => id !== vraag.doel)).slice(0, 3);
  return schud([vraag.doel, ...anderen]).map((id) => ({ id, label: namen[id] ?? id }));
}

function slotVoor(vraag: EuropaVraag, objecten: Objecten): Slot {
  return {
    id: nieuwId(),
    vraagId: vraag.id,
    vraagVersie: vraag.version,
    hulp: { hints: 0, uitleg: false, fouten: 0 },
    ...(vraag.type === "choice" && !vraag.opties ? { opties: maakOpties(vraag, objecten) } : {}),
  };
}

/** Vraagplaatsen voor afwisselend oefenen: per onderwerp alle objecten, onderwerpen om en om. */
export function maakEuropaSlots(landen: string[], onderwerpen: EuropaOnderwerp[]): Slot[] {
  const objecten = objectenVoorSelectie(landen);
  const alle = alleEuropaVragen();
  const groepen: Slot[][] = [];

  for (const onderwerp of onderwerpen) {
    if (onderwerp === "ligging") {
      const uniek = new Map<string, EuropaVraag>();
      for (const v of alle) {
        if (v.module !== "relative" || !(v.vereist ?? [v.doel]).every((id) => landen.includes(id))) continue;
        const sleutel = `${v.referentie}-${v.doel}`;
        if (!uniek.has(sleutel)) uniek.set(sleutel, v);
      }
      groepen.push(schud([...uniek.values()]).map((v) => slotVoor(v, objecten)));
      continue;
    }
    const modules = onderwerp === "wateren" ? (["waters", "rivers"] as const) : onderwerp === "landen" ? (["countries"] as const) : onderwerp === "hoofdsteden" ? (["capitals"] as const) : (["mountains"] as const);
    for (const mod of modules) {
      const ids = schud(objecten[mod]);
      groepen.push(
        ids
          .map((objectId, i) => {
            const kandidaten = alle.filter((v) => v.module === mod && v.doel === objectId);
            // Aanwijzen en meerkeuze afwisselen; met minder dan twee objecten kan alleen aanwijzen.
            const voorkeur = ids.length < 2 ? "map-click" : i % 2 ? "choice" : "map-click";
            const vraag = kandidaten.find((v) => v.type === voorkeur) ?? kandidaten[0];
            return vraag ? slotVoor(vraag, objecten) : null;
          })
          .filter((s): s is Slot => s !== null),
      );
    }
  }

  const slots: Slot[] = [];
  while (groepen.some((g) => g.length)) for (const g of groepen) if (g.length) slots.push(g.shift()!);
  return slots;
}

export function maakPuzzelSlots(landen: string[]): Slot[] {
  return schud(landen)
    .map((id) => europaVraag(`puzzel-${id}`))
    .filter((v): v is EuropaVraag => v !== null)
    .map((v) => ({ id: nieuwId(), vraagId: v.id, vraagVersie: v.version, hulp: { hints: 0, uitleg: false, fouten: 0 } }));
}

/**
 * Herhaling na hulp: één keer per object, drie plaatsen later ingevoegd.
 * Bij landen wisselt de vorm (aanwijzen ↔ naam kiezen), zodat het geen kopie van dezelfde vraag is.
 */
export function europaHerhaling(oorsprong: Slot, landen: string[]): Slot | null {
  const vraag = europaVraag(oorsprong.vraagId);
  if (!vraag || vraag.module === "puzzel") return null;
  const objecten = objectenVoorSelectie(landen);
  let herhaling: EuropaVraag | null = vraag;
  if (vraag.module === "countries" && objecten.countries.length >= 2) {
    herhaling = europaVraag(vraag.type === "map-click" ? `identify-${vraag.doel}` : `country-${vraag.doel}`) ?? vraag;
  }
  return { ...slotVoor(herhaling, objecten), herhalingVan: oorsprong.id };
}

/** Aantal onderdelen in een selectie, zonder vragen te maken (voor de samenvatting). */
export function telEuropaOnderdelen(landen: string[], onderwerpen: EuropaOnderwerp[]) {
  const o = objectenVoorSelectie(landen);
  let totaal = 0;
  for (const onderwerp of onderwerpen) {
    if (onderwerp === "landen") totaal += o.countries.length;
    else if (onderwerp === "hoofdsteden") totaal += o.capitals.length;
    else if (onderwerp === "wateren") totaal += o.waters.length + o.rivers.length;
    else if (onderwerp === "gebergten") totaal += o.mountains.length;
    else {
      const uniek = new Set(
        alleEuropaVragen()
          .filter((v) => v.module === "relative" && (v.vereist ?? [v.doel]).every((id) => landen.includes(id)))
          .map((v) => `${v.referentie}-${v.doel}`),
      );
      totaal += uniek.size;
    }
  }
  return totaal;
}
