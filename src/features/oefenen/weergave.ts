import { vindOnderdeel, vindOnderdeelBijLeerdoel } from "@/content/onderwerpen";
import type { Sessie } from "./types";

// Namen en routes voor sessies en leerdoelen, gedeeld door kind- en ouderschermen.

const europaNamen: Record<string, string> = {
  "europa-landen": "Europa: landen",
  "europa-hoofdsteden": "Europa: hoofdsteden",
  "europa-wateren": "Europa: wateren",
  "europa-gebergten": "Europa: gebergten",
  "europa-ligging": "Europa: ligging",
};

export function leerdoelNaam(leerdoelId: string) {
  const t = leerdoelId.match(/^(tafel|deeltafel)-(\d+)$/);
  if (t) return t[1] === "tafel" ? `De tafel van ${t[2]}` : `Delen door ${t[2]}`;
  return europaNamen[leerdoelId] ?? vindOnderdeelBijLeerdoel(leerdoelId)?.onderdeel.naam ?? leerdoelId;
}

export type LeerdoelSoort = "breuken" | "tafels" | "europa";
export function leerdoelSoort(leerdoelId: string): LeerdoelSoort {
  if (/^(tafel|deeltafel)-/.test(leerdoelId)) return "tafels";
  if (leerdoelId.startsWith("europa-")) return "europa";
  return "breuken";
}

/** Waar een kind dit leerdoel opnieuw kan oefenen. */
export function leerdoelOefenRoute(leerdoelId: string) {
  const t = leerdoelId.match(/^(tafel|deeltafel)-(\d+)$/);
  if (t) return `/kind/tafeltrainer?tafel=${t[2]}`;
  if (leerdoelId.startsWith("europa-")) return "/kind/aardrijkskunde/europa";
  const o = vindOnderdeelBijLeerdoel(leerdoelId);
  return o ? `/kind/oefening/instellen?onderdeel=${o.onderdeel.id}` : "/kind/rekenen";
}

export function sessieNaam(sessie: Sessie) {
  switch (sessie.soort) {
    case "tafels": {
      const t = sessie.instellingen?.tafels ?? [];
      return t.length === 1 ? `De tafel van ${t[0]}` : `Tafels van ${t.slice(0, -1).join(", ")} en ${t.at(-1)}`;
    }
    case "europa":
      return "Europa";
    case "puzzel":
      return "Landenpuzzel";
    case "niveau":
      return "Wat past bij jou?";
    default:
      return vindOnderdeel(sessie.onderdeelId)?.onderdeel.naam ?? sessie.onderdeelId;
  }
}

/** Instelpagina om een vergelijkbare oefening opnieuw te starten. */
export function sessieInstelRoute(sessie: Sessie) {
  switch (sessie.soort) {
    case "tafels":
      return "/kind/tafeltrainer";
    case "europa":
    case "puzzel":
      return "/kind/aardrijkskunde/europa";
    case "niveau":
      return "/kind/niveaubepaling";
    default:
      return `/kind/oefening/instellen?onderdeel=${sessie.onderdeelId}`;
  }
}
