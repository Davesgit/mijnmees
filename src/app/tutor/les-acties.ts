"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormStatus } from "@/components/mees/Formulier";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { haalLesvoorstel, haalTutorLes, planLes, sluitRuimte, zetLesStatus, zetVoorstelOpzij, zetVraagStatus } from "@/features/live/server";
import { amsterdamNaarUtc, kanStarten, lesConfig } from "@/features/live/regels";
import { tutorhulpMogelijk } from "@/features/tutorhulp/criteria";
import { audit } from "@/lib/server/dal";
import { vereisTutor } from "@/lib/server/rollen";
import { createAdminClient } from "@/lib/supabase/admin";

const planSchema = z.object({
  leerdoelId: z.string().max(80),
  titel: z.string().trim().min(3, { error: "Geef de les een titel." }).max(120),
  start: z.string().max(20),
  duur: z.coerce.number().int().min(lesConfig.minDuur).max(lesConfig.maxDuur),
  capaciteit: z.coerce.number().int().min(1).max(lesConfig.maxCapaciteit),
});

/** L01: plannen + uitnodigingen aanmaken. Persistent; er gaat pas iets naar ouders als dit lukt. */
export async function planLesActie(_: FormStatus, form: FormData): Promise<FormStatus> {
  const tutor = await vereisTutor("/tutor/lessen/inplannen");
  const waarden = Object.fromEntries(["leerdoelId", "titel", "start", "duur", "capaciteit"].map((k) => [k, String(form.get(k) ?? "")]));
  const invoer = planSchema.safeParse(waarden);
  if (!invoer.success) return { fouten: Object.fromEntries(invoer.error.issues.map((i) => [String(i.path[0]), i.message])), waarden };
  if (!tutorhulpMogelijk(invoer.data.leerdoelId)) return { melding: "Voor dit onderdeel kun je nog geen les plannen.", waarden };
  const startOp = amsterdamNaarUtc(invoer.data.start);
  if (!startOp) return { fouten: { start: "Kies een datum en tijd." }, waarden };
  if (Date.parse(startOp) < Date.now() + 10 * 60_000) return { fouten: { start: "Kies een moment dat minstens 10 minuten in de toekomst ligt." }, waarden };
  if (Date.parse(startOp) > Date.now() + 60 * 86_400_000) return { fouten: { start: "Plan hooguit twee maanden vooruit." }, waarden };

  const r = await planLes(tutor, { leerdoelId: invoer.data.leerdoelId, titel: invoer.data.titel, startOp, duurMin: invoer.data.duur, capaciteit: invoer.data.capaciteit, opnemen: form.get("opnemen") === "on" });
  if ("fout" in r) return { melding: r.fout, waarden };
  await audit(tutor.id, "les-gepland", r.id);
  revalidatePath("/tutor", "layout");
  redirect(`/tutor/lessen?gepland=${r.uitgenodigd}`);
}

export async function geenLesNodig(form: FormData) {
  const tutor = await vereisTutor();
  const leerdoelId = String(form.get("leerdoelId") ?? "");
  const reden = String(form.get("reden") ?? "").trim().slice(0, 300) || "Nog geen les nodig.";
  if (await haalLesvoorstel(leerdoelId)) await zetVoorstelOpzij(tutor, leerdoelId, reden);
  revalidatePath("/tutor", "layout");
  redirect("/tutor");
}

export async function annuleerLes(form: FormData) {
  const tutor = await vereisTutor();
  const les = await haalTutorLes(tutor, String(form.get("lesId") ?? ""));
  if (les && les.status === "gepland") {
    await zetLesStatus(tutor, les.id, { status: "geannuleerd" });
    await audit(tutor.id, "les-geannuleerd", les.id);
  }
  revalidatePath("/tutor", "layout");
  redirect("/tutor/lessen");
}

/** Start: alleen binnen het startvenster. Maakt (als gekozen) alvast een conceptuitleg voor de opname. */
export async function startLes(lesId: string): Promise<{ ok: boolean; melding?: string; opnameUitlegId?: string | null }> {
  const tutor = await vereisTutor();
  const les = await haalTutorLes(tutor, lesId);
  if (!les || (les.status !== "gepland" && les.status !== "live")) return { ok: false, melding: "Deze les kan niet (meer) starten." };
  if (!kanStarten(les.startOp, les.duurMin)) return { ok: false, melding: `Je kunt de les starten vanaf ${lesConfig.startVensterMin} minuten voor de begintijd.` };
  let opnameUitlegId = les.opnameUitlegId;
  if (les.opnemen && !opnameUitlegId) {
    const { data } = await createAdminClient()
      .from("uitleg")
      .insert({ tutor_id: tutor.id, leerdoel_id: les.leerdoelId, titel: `Live-les: ${leerdoelNaam(les.leerdoelId)}` })
      .select("id")
      .single();
    opnameUitlegId = data?.id ?? null;
  }
  await zetLesStatus(tutor, les.id, { status: "live", gestart_op: new Date().toISOString(), ...(opnameUitlegId ? { opname_uitleg_id: opnameUitlegId } : {}) });
  await audit(tutor.id, "les-gestart", les.id);
  return { ok: true, opnameUitlegId };
}

export async function beeindigLes(lesId: string) {
  const tutor = await vereisTutor();
  const les = await haalTutorLes(tutor, lesId);
  if (!les) return { ok: false };
  await zetLesStatus(tutor, les.id, { status: "afgelopen", geeindigd_op: new Date().toISOString() });
  await sluitRuimte(les);
  await audit(tutor.id, "les-beeindigd", les.id);
  revalidatePath("/tutor", "layout");
  return { ok: true };
}

export async function pauzeerVragen(lesId: string, gepauzeerd: boolean) {
  const tutor = await vereisTutor();
  return zetLesStatus(tutor, lesId, { vragen_gepauzeerd: gepauzeerd });
}

export async function markeerVraag(lesId: string, vraagId: string, status: "nieuw" | "apart" | "beantwoord") {
  const tutor = await vereisTutor();
  return zetVraagStatus(tutor, lesId, vraagId, status);
}
