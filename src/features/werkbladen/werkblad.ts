import { tafelVraag } from "@/features/oefenen/tafel-vragen";
import { vindVraag, vragenVoorLeerdoel, type Niveau } from "@/features/oefenen/vragen";

// Werkbladen: een vaste set vraagversies. Voorbeeld, werkblad en antwoordblad gebruiken exact dezelfde set.

export type WerkbladOnderwerp = "breuken" | "tafels";

export type WerkbladInstellingen = {
  vak: "rekenen";
  onderwerpen: WerkbladOnderwerp[];
  niveau: Niveau;
  tafels: number[];
  bewerkingen: ("x" | ":")[];
  aantal: number;
  /** Bepaalt de vraagkeuze; hetzelfde getal geeft hetzelfde blad. */
  seed: number;
};

export type Werkblad = {
  id: string;
  code: string;
  titel: string;
  instellingen: WerkbladInstellingen;
  vragen: { vraagId: string; versie: number }[];
  aangemaaktOp: string;
  kindId?: string | null;
};

export const werkbladConfig = { minAantal: 4, maxAantal: 20, standaardAantal: 8 } as const;

/** Kleine voorspelbare toevalsgenerator (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function schud<T>(lijst: T[], r: () => number): T[] {
  const kopie = [...lijst];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

const niveauVolgorde: Record<Niveau, Niveau[]> = {
  makkelijk: ["makkelijk", "past-bij-mij", "uitdagend"],
  "past-bij-mij": ["past-bij-mij", "makkelijk", "uitdagend"],
  uitdagend: ["uitdagend", "past-bij-mij", "makkelijk"],
};

/** Kiest de vragen voor een werkblad; de aantallen worden over de onderwerpen verdeeld. */
export function kiesWerkbladVragen(inst: WerkbladInstellingen): string[] {
  const r = rng(inst.seed);
  const onderwerpen = inst.onderwerpen.filter((o) => o !== "tafels" || inst.tafels.length > 0);
  if (onderwerpen.length === 0) return [];
  const aantal = Math.min(werkbladConfig.maxAantal, Math.max(werkbladConfig.minAantal, inst.aantal));
  const verdeling = onderwerpen.map((_, i) => Math.floor(aantal / onderwerpen.length) + (i < aantal % onderwerpen.length ? 1 : 0));

  const gekozen: string[] = [];
  onderwerpen.forEach((onderwerp, i) => {
    const nodig = verdeling[i];
    if (onderwerp === "breuken") {
      const pool = vragenVoorLeerdoel("breuken-vergelijken");
      const lijst: string[] = [];
      for (const n of niveauVolgorde[inst.niveau]) {
        lijst.push(...schud(pool.filter((v) => v.difficulty === n).map((v) => v.id), r).slice(0, nodig - lijst.length));
        if (lijst.length >= nodig) break;
      }
      gekozen.push(...lijst);
    } else {
      const ids = inst.tafels.flatMap((t) =>
        inst.bewerkingen.flatMap((b) => [2, 3, 4, 5, 6, 7, 8, 9].map((f) => (b === "x" ? `tafel-${t}-x-${f}` : `tafel-${t}-d-${t * f}`))),
      );
      gekozen.push(...schud(ids.filter((id) => tafelVraag(id)), r).slice(0, nodig));
    }
  });
  return gekozen;
}

export function werkbladTitel(inst: WerkbladInstellingen) {
  const delen: string[] = [];
  if (inst.onderwerpen.includes("breuken")) delen.push("Breuken vergelijken");
  if (inst.onderwerpen.includes("tafels") && inst.tafels.length) {
    const t = [...inst.tafels].sort((a, b) => a - b);
    delen.push(t.length === 1 ? `De tafel van ${t[0]}` : `Tafels van ${t.slice(0, -1).join(", ")} en ${t.at(-1)}`);
  }
  return `Rekenen · ${delen.join(" en ")}`;
}

/** Maakt een werkblad met een nieuwe id; aanpassen geeft altijd een nieuw blad. */
export function maakWerkblad(inst: WerkbladInstellingen): Werkblad {
  const id = crypto.randomUUID();
  const vragen = kiesWerkbladVragen(inst).map((vraagId) => ({ vraagId, versie: vindVraag(vraagId)?.version ?? 1 }));
  return {
    id,
    code: `WB-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    titel: werkbladTitel(inst),
    instellingen: inst,
    vragen,
    aangemaaktOp: new Date().toISOString(),
  };
}

export function nieuweSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

// ---------- Lokale werkbladen (zonder ouderaccount) ----------

const SLEUTEL = "mees:werkbladen:v1";

export function leesLokaleWerkbladen(): Werkblad[] {
  try {
    return JSON.parse(localStorage.getItem(SLEUTEL) ?? "[]") as Werkblad[];
  } catch {
    return [];
  }
}

export function bewaarLokaalWerkblad(w: Werkblad) {
  try {
    const lijst = [w, ...leesLokaleWerkbladen().filter((x) => x.id !== w.id)].slice(0, 30);
    localStorage.setItem(SLEUTEL, JSON.stringify(lijst));
    return true;
  } catch {
    return false;
  }
}
