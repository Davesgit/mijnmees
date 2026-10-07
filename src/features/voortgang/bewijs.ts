import { dagenGeleden } from "@/lib/datum";
import type { OpslagData } from "@/features/oefenen/types";

/**
 * Bouwvoorstel voor de bewijsstatus (ontwerpregels §8). Configureerbaar; geen diagnose.
 * "Gaat zelfstandig": ≥4 zelfstandig goede eerste pogingen op verschillende vragen, verdeeld over ≥2 sessies.
 * Na 7 dagen zonder oefenen komt het leerdoel terug als "Nog eens oefenen".
 */
export const bewijsConfig = {
  versie: "2026-10-08",
  minZelfstandig: 4,
  minSessies: 2,
  reviewNaDagen: 7,
} as const;

export type BewijsStatus = "aan-het-oefenen" | "gaat-zelfstandig" | "nog-eens-oefenen";

export type LeerdoelBewijs = {
  leerdoelId: string;
  status: BewijsStatus;
  zelfstandig: number;
  laatstGeoefend: string;
};

export function berekenBewijs(data: OpslagData, nu = new Date()): LeerdoelBewijs[] {
  const perDoel = new Map<string, { vragen: Set<string>; sessies: Set<string>; laatst: string }>();

  for (const p of data.pogingen) {
    const doel = perDoel.get(p.leerdoelId) ?? { vragen: new Set(), sessies: new Set(), laatst: p.op };
    if (p.op > doel.laatst) doel.laatst = p.op;
    const zelfstandig = p.resultaat === "goed" && p.eerstePoging && p.hulpVooraf.hints === 0 && !p.hulpVooraf.uitleg;
    if (zelfstandig) {
      doel.vragen.add(p.vraagId);
      doel.sessies.add(p.sessieId);
    }
    perDoel.set(p.leerdoelId, doel);
  }

  const reviewDoelen = new Set(data.reviews.map((r) => r.leerdoelId));

  return [...perDoel.entries()].map(([leerdoelId, d]) => {
    const zelfstandig = d.vragen.size >= bewijsConfig.minZelfstandig && d.sessies.size >= bewijsConfig.minSessies;
    let status: BewijsStatus = zelfstandig ? "gaat-zelfstandig" : "aan-het-oefenen";
    if (reviewDoelen.has(leerdoelId) || (zelfstandig && dagenGeleden(d.laatst, nu) >= bewijsConfig.reviewNaDagen)) {
      status = "nog-eens-oefenen";
    }
    return { leerdoelId, status, zelfstandig: d.vragen.size, laatstGeoefend: d.laatst };
  });
}
