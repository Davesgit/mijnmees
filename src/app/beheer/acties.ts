"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/server/dal";
import { vereisBeheerder } from "@/lib/server/rollen";
import { createAdminClient } from "@/lib/supabase/admin";

const beoordelingSchema = z.object({
  tutorId: z.uuid(),
  status: z.enum(["goedgekeurd", "afgewezen", "geschorst", "aangemeld"]),
});

/** Alleen een beheerder zet de tutorstatus. Geschorst/afgewezen: geen toegang meer tot hulpvragen. */
export async function beoordeelTutor(form: FormData) {
  const beheerder = await vereisBeheerder();
  const invoer = beoordelingSchema.safeParse({ tutorId: form.get("tutorId"), status: form.get("status") });
  if (!invoer.success) return;
  const db = createAdminClient();
  await db
    .from("tutors")
    .update({ status: invoer.data.status, beoordeeld_op: new Date().toISOString(), beoordeeld_door: beheerder.id })
    .eq("id", invoer.data.tutorId);
  // Opgepakte hulpvragen van een geschorste tutor gaan terug naar de werkvoorraad.
  if (invoer.data.status !== "goedgekeurd") {
    await db.from("hulpvragen").update({ status: "nieuw", tutor_id: null, geclaimd_op: null, claim_tot: null }).eq("tutor_id", invoer.data.tutorId).eq("status", "in-behandeling");
  }
  await audit(beheerder.id, `tutor-${invoer.data.status}`, invoer.data.tutorId);
  revalidatePath("/beheer");
}
