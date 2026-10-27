// Voortgang in het gesprek: eerst kiezen waarvan, dan een samenvatting in gewone woorden, een overzicht en
// voorstellen om verder te oefenen. Pure functies (geen opslag of React), zodat ze te testen zijn.

import { vindOnderdeelBijLeerdoel } from "@/content/onderwerpen";
import type { OpslagData } from "@/features/oefenen/types";
import { leerdoelNaam, leerdoelSoort, type LeerdoelSoort } from "@/features/oefenen/weergave";
import { berekenBewijs, type LeerdoelBewijs } from "@/features/voortgang/bewijs";
import type { Keuze } from "./gesprek";

export type VoortgangFilter = "alles" | LeerdoelSoort;

export const filterNaam: Record<VoortgangFilter, string> = { alles: "Alles", breuken: "Breuken", tafels: "Tafels", europa: "Topo Europa" };
const filterIn: Record<VoortgangFilter, string> = { alles: "", breuken: "Bij breuken", tafels: "Bij de tafels", europa: "Bij topo Europa" };

/** Voortgang van één filter, in een vaste volgorde: eerst wat nog eens moet, dan oefenen, dan zelfstandig. */
export function voortgangVan(data: OpslagData, filter: VoortgangFilter, nu?: Date): LeerdoelBewijs[] {
  const volgorde = { "nog-eens-oefenen": 0, "aan-het-oefenen": 1, "gaat-zelfstandig": 2 } as const;
  return berekenBewijs(data, nu)
    .filter((b) => filter === "alles" || leerdoelSoort(b.leerdoelId) === filter)
    .sort((a, b) => volgorde[a.status] - volgorde[b.status] || b.laatstGeoefend.localeCompare(a.laatstGeoefend));
}

/** Onderdelen waarin al geoefend is (voor de keuzes "waarvan wil je je voortgang zien?"). */
export function voortgangSoorten(data: OpslagData): LeerdoelSoort[] {
  const soorten = new Set(berekenBewijs(data).map((b) => leerdoelSoort(b.leerdoelId)));
  return (["breuken", "tafels", "europa"] as const).filter((s) => soorten.has(s));
}

const opsomming = (namen: string[]) => (namen.length <= 1 ? (namen[0] ?? "") : `${namen.slice(0, -1).join(", ")} en ${namen.at(-1)}`);
const kort = (namen: string[], max = 3) => (namen.length > max ? `${opsomming(namen.slice(0, max))} en nog ${namen.length - max} andere` : opsomming(namen));

/** Een samenvatting in gewone woorden, zoals Mees het zou zeggen. */
export function voortgangSamenvatting(items: LeerdoelBewijs[], filter: VoortgangFilter): string {
  if (items.length === 0) return filter === "alles" ? "Je hebt nog niet geoefend. Zullen we beginnen?" : `${filterIn[filter]} heb je nog niet geoefend. Zullen we beginnen?`;
  const naam = (b: LeerdoelBewijs) => leerdoelNaam(b.leerdoelId).replace(/^De /, "de ");
  const zelf = items.filter((b) => b.status === "gaat-zelfstandig").map(naam);
  const bezig = items.filter((b) => b.status === "aan-het-oefenen").map(naam);
  const terug = items.filter((b) => b.status === "nog-eens-oefenen").map(naam);
  const zinnen: string[] = [];
  if (filter !== "alles") zinnen.push(`${filterIn[filter]} zie ik dit.`);
  if (zelf.length && !bezig.length && !terug.length) zinnen.push("Knap! Alles wat je hebt geoefend, gaat zelfstandig.");
  else if (zelf.length) zinnen.push(`Knap! ${hoofdletter(kort(zelf))} ${zelf.length === 1 ? "gaat" : "gaan"} al zelfstandig.`);
  else zinnen.push("Je bent goed bezig.");
  if (bezig.length) zinnen.push(`Met ${kort(bezig)} ben je nog aan het oefenen.`);
  if (terug.length) zinnen.push(`${hoofdletter(kort(terug))} heb je een tijdje niet gedaan. Kijk eens of het nog lukt!`);
  return zinnen.join(" ");
}

const hoofdletter = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Keuze om een leerdoel te oefenen, binnen het gesprek. */
export function oefenKeuze(leerdoelId: string): Keuze {
  const naam = leerdoelNaam(leerdoelId);
  const t = leerdoelId.match(/^(tafel|deeltafel)-(\d+)$/);
  if (t) return { label: `${naam} oefenen`, soort: "kaart", tekst: `${naam}. Kies nog hoe je wilt oefenen.`, kaart: { soort: "tafels", tafels: [Number(t[2])], ...(t[1] === "deeltafel" ? { bewerking: ":" as const } : {}) } };
  if (leerdoelId.startsWith("europa-")) {
    const onderwerp = { "europa-landen": "landen", "europa-hoofdsteden": "hoofdsteden", "europa-wateren": "wateren", "europa-gebergten": "gebergten", "europa-ligging": "ligging" }[leerdoelId];
    return { label: `${naam} oefenen`, soort: "kaart", tekst: "Kies welk gebied je wilt oefenen.", kaart: { soort: "europa", onderwerpen: onderwerp ? [onderwerp] : undefined } };
  }
  const o = vindOnderdeelBijLeerdoel(leerdoelId);
  return { label: `${naam} oefenen`, soort: "kaart", tekst: "Kies hoeveel vragen je wilt doen.", kaart: { soort: "voorstel", standaard: o ? `doel:${o.onderdeel.id}` : "" } };
}

/** Voorstellen na het overzicht: eerst wat nog eens moet, dan wat je aan het oefenen bent (hooguit twee). */
export function voortgangVoorstellen(items: LeerdoelBewijs[]): Keuze[] {
  return items
    .filter((b) => b.status !== "gaat-zelfstandig")
    .slice(0, 2)
    .map((b) => oefenKeuze(b.leerdoelId));
}
