"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TOESTEMMING_VERSIE } from "@/lib/kinderen";
import { isOuderOntgrendeld } from "@/lib/server/cookies";
import { audit, haalEigenKind, vereisOuder } from "@/lib/server/dal";
import { createAdminClient } from "@/lib/supabase/admin";

/** L03: ouder staat deelname toe of niet. Weigeren heeft geen gevolgen voor het oefenen. */
export async function besluitOverLes(form: FormData) {
  const ouder = await vereisOuder();
  const lesId = String(form.get("lesId") ?? "");
  if (!(await isOuderOntgrendeld(ouder.id))) redirect(`/ouder/ontgrendel?terug=/ouder/lessen/${lesId}`);
  const kind = await haalEigenKind(String(form.get("kindId") ?? ""));
  const besluit = form.get("besluit") === "toestaan" ? "toegestaan" : "geweigerd";
  if (kind) {
    await createAdminClient()
      .from("les_uitnodigingen")
      .update({ status: besluit, beleid_versie: TOESTEMMING_VERSIE, ouder_besluit_op: new Date().toISOString(), ...(besluit === "geweigerd" ? { kind_aanmelding: null } : {}) })
      .eq("les_id", lesId)
      .eq("kind_id", kind.id)
      .eq("ouder_id", ouder.id);
    await audit(ouder.id, `les-${besluit}`, lesId);
  }
  revalidatePath("/ouder", "layout");
  redirect(`/ouder/lessen/${lesId}?kind=${kind?.id ?? ""}&bewaard=1`);
}
