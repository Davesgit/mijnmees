"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { vragenGeldig, werkbladSchema } from "@/features/werkbladen/server";
import type { Werkblad } from "@/features/werkbladen/werkblad";
import { audit, haalActiefKind, haalEigenKind, haalOuder, vereisOuder } from "@/lib/server/dal";
import { isOuderOntgrendeld } from "@/lib/server/cookies";
import { createClient } from "@/lib/supabase/server";

/**
 * Bewaart een werkblad bij de ingelogde ouder. Zonder account: "lokaal" (het blijft in de browser).
 * Het werkblad wordt gekoppeld aan het kind dat op dit apparaat oefent, als dat er is.
 */
export async function bewaarWerkblad(werkblad: Werkblad): Promise<{ opslag: "server" | "lokaal" | "fout" }> {
  const ouder = await haalOuder();
  if (!ouder) return { opslag: "lokaal" };
  const invoer = werkbladSchema.safeParse(werkblad);
  if (!invoer.success || !vragenGeldig(invoer.data)) return { opslag: "fout" };
  const kind = await haalActiefKind();
  const supabase = await createClient();
  const { error } = await supabase.from("werkbladen").insert({
    id: invoer.data.id,
    code: invoer.data.code,
    ouder_id: ouder.id,
    kind_id: kind?.id ?? null,
    titel: invoer.data.titel,
    instellingen: invoer.data.instellingen,
    vragen: invoer.data.vragen,
  });
  if (error) return { opslag: "fout" };
  return { opslag: "server" };
}

const regelSchema = z.object({
  vraagId: z.string().max(80),
  uitkomst: z.enum(["goed", "fout", "onbekend"]),
  hulp: z.enum(["onbekend", "met-hulp", "zelfstandig"]),
});

export type PapierStatus = { gelukt?: boolean; melding?: string; versie?: number };

/** O04: ouder registreert papierwerk. Elke keer bewaren is een nieuwe versie; oude versies blijven bestaan. */
export async function bewaarPapierresultaten(_: PapierStatus, form: FormData): Promise<PapierStatus> {
  const ouder = await vereisOuder();
  if (!(await isOuderOntgrendeld(ouder.id))) return { melding: "Vul eerst opnieuw je wachtwoord in via Voor ouders." };
  const werkbladId = String(form.get("werkbladId") ?? "");
  const kind = await haalEigenKind(String(form.get("kindId") ?? ""));
  if (!kind) return { melding: "Kies een kind." };

  const supabase = await createClient();
  const { data: werkblad } = await supabase.from("werkbladen").select("id, vragen").eq("id", werkbladId).maybeSingle();
  if (!werkblad) return { melding: "Dit werkblad hoort niet bij je account." };

  const vragen = (werkblad.vragen as { vraagId: string }[]).map((v) => v.vraagId);
  const regels = vragen.map((vraagId, i) => ({
    vraagId,
    uitkomst: String(form.get(`uitkomst-${i}`) ?? "onbekend"),
    hulp: String(form.get(`hulp-${i}`) ?? "onbekend"),
  }));
  const geldig = z.array(regelSchema).safeParse(regels);
  if (!geldig.success) return { melding: "Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens." };

  const { data: laatste } = await supabase
    .from("papier_resultaten")
    .select("versie")
    .eq("werkblad_id", werkbladId)
    .eq("kind_id", kind.id)
    .order("versie", { ascending: false })
    .limit(1)
    .maybeSingle();
  const versie = (laatste?.versie ?? 0) + 1;

  const { error } = await supabase
    .from("papier_resultaten")
    .insert({ werkblad_id: werkbladId, kind_id: kind.id, ouder_id: ouder.id, versie, regels: geldig.data });
  if (error) {
    // Twee keer tegelijk opslaan: de unieke versie voorkomt dubbele regels.
    return { melding: error.code === "23505" ? "Deze resultaten zijn net al bewaard. Ververs de pagina." : "Dit lukt nu niet. Probeer het nog eens." };
  }
  await audit(ouder.id, "papier-geregistreerd", werkbladId);
  revalidatePath("/ouder", "layout");
  return { gelukt: true, versie, melding: "De papierresultaten zijn bewaard." };
}
