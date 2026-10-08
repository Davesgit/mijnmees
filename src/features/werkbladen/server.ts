import "server-only";
import { z } from "zod";
import { vindVraag } from "@/features/oefenen/vragen";
import { haalOuder } from "@/lib/server/dal";
import { createClient } from "@/lib/supabase/server";
import type { Werkblad } from "./werkblad";

export const werkbladSchema = z.object({
  id: z.uuid(),
  code: z.string().regex(/^WB-[A-Z0-9]{4,8}$/),
  titel: z.string().max(120),
  instellingen: z.object({
    vak: z.literal("rekenen"),
    onderwerpen: z.array(z.enum(["breuken", "tafels"])).min(1).max(2),
    niveau: z.enum(["makkelijk", "past-bij-mij", "uitdagend"]),
    tafels: z.array(z.number().int().min(1).max(12)).max(12),
    bewerkingen: z.array(z.enum(["x", ":"])).max(2),
    aantal: z.number().int().min(4).max(20),
    seed: z.number().int().min(0),
  }),
  vragen: z.array(z.object({ vraagId: z.string().max(80), versie: z.number().int().min(1) })).min(1).max(20),
  aangemaaktOp: z.iso.datetime({ offset: true }),
});

type Rij = { id: string; code: string; titel: string; instellingen: Werkblad["instellingen"]; vragen: Werkblad["vragen"]; aangemaakt_op: string; kind_id: string | null };

export const naarWerkblad = (r: Rij): Werkblad => ({
  id: r.id,
  code: r.code,
  titel: r.titel,
  instellingen: r.instellingen,
  vragen: r.vragen,
  aangemaaktOp: r.aangemaakt_op,
  kindId: r.kind_id,
});

/** Werkblad van de ingelogde ouder (RLS controleert het eigendom). */
export async function haalEigenWerkblad(id: string): Promise<Werkblad | null> {
  const ouder = await haalOuder();
  if (!ouder || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("werkbladen").select("id, code, titel, instellingen, vragen, aangemaakt_op, kind_id").eq("id", id).maybeSingle();
  return data ? naarWerkblad(data as Rij) : null;
}

export async function haalEigenWerkbladen(limiet = 10): Promise<Werkblad[]> {
  const ouder = await haalOuder();
  if (!ouder) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("werkbladen")
    .select("id, code, titel, instellingen, vragen, aangemaakt_op, kind_id")
    .eq("ouder_id", ouder.id)
    .order("aangemaakt_op", { ascending: false })
    .limit(limiet);
  return ((data ?? []) as Rij[]).map(naarWerkblad);
}

/** Alleen bestaande vraagversies zijn geldig op een werkblad. */
export function vragenGeldig(w: Pick<Werkblad, "vragen">) {
  return w.vragen.every((v) => vindVraag(v.vraagId)?.version === v.versie);
}

export type PapierSamenvatting = { werkbladId: string; versie: number; op: string; totaal: number; nagekeken: number; goed: number; zelfstandig: number };

/** Laatste versie van het papierwerk per werkblad voor één kind (los van digitaal bewijs). */
export async function haalPapierSamenvattingen(kindId: string): Promise<Map<string, PapierSamenvatting>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("papier_resultaten")
    .select("werkblad_id, versie, regels, op")
    .eq("kind_id", kindId)
    .order("versie", { ascending: false })
    .limit(200);
  const uit = new Map<string, PapierSamenvatting>();
  for (const r of data ?? []) {
    if (uit.has(r.werkblad_id)) continue;
    const regels = r.regels as { uitkomst: string; hulp: string }[];
    uit.set(r.werkblad_id, {
      werkbladId: r.werkblad_id,
      versie: r.versie,
      op: r.op,
      totaal: regels.length,
      nagekeken: regels.filter((x) => x.uitkomst !== "onbekend").length,
      goed: regels.filter((x) => x.uitkomst === "goed").length,
      zelfstandig: regels.filter((x) => x.uitkomst === "goed" && x.hulp === "zelfstandig").length,
    });
  }
  return uit;
}
