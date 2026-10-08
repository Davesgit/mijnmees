"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { tutorhulpMogelijk } from "@/features/tutorhulp/criteria";
import { geschiktheidVoorKind } from "@/features/tutorhulp/server";
import { TOESTEMMING_VERSIE } from "@/lib/kinderen";
import { isOuderOntgrendeld } from "@/lib/server/cookies";
import { audit, haalEigenKind, vereisOuder } from "@/lib/server/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type HulpStatus = { melding?: string };

/** O03: de ouder stuurt de hulpvraag naar een tutor. Server toetst toestemming, criteria en dubbele aanvragen. */
export async function stuurNaarTutor(_: HulpStatus, form: FormData): Promise<HulpStatus> {
  const ouder = await vereisOuder();
  if (!(await isOuderOntgrendeld(ouder.id))) return { melding: "Vul eerst opnieuw je wachtwoord in via Voor ouders." };
  const kind = await haalEigenKind(String(form.get("kindId") ?? ""));
  const leerdoelId = String(form.get("leerdoelId") ?? "");
  if (!kind || !tutorhulpMogelijk(leerdoelId)) return { melding: "Dit lukt nu niet. Probeer het nog eens." };

  const supabase = await createClient();
  const { data: instelling } = await supabase.from("kinderen").select("tutorhulp_toegestaan").eq("id", kind.id).single();
  if (!instelling?.tutorhulp_toegestaan) return { melding: `Zet eerst tutorhulp aan voor ${kind.voornaam} bij Instellingen.` };

  const geschiktheid = await geschiktheidVoorKind(kind.id, leerdoelId);
  if (!geschiktheid?.geschikt) return { melding: "Een tutor is nu nog niet passend. Laat eerst de uitleg en een soortgelijke vraag proberen." };

  const db = createAdminClient();
  const { data, error } = await db
    .from("hulpvragen")
    .insert({
      ouder_id: ouder.id,
      kind_id: kind.id,
      leerdoel_id: leerdoelId,
      bewijs: geschiktheid.bewijs,
      criteria_versie: geschiktheid.bewijs.criteriaVersie,
      toestemming_versie: TOESTEMMING_VERSIE,
    })
    .select("id")
    .single();

  let hulpvraagId = data?.id as string | undefined;
  if (error) {
    if (error.code !== "23505") return { melding: "Dit lukt nu niet. Probeer het nog eens." };
    // Er staat al een open hulpvraag: geen tweede aanvraag, toon de bestaande.
    const { data: bestaand } = await supabase.from("hulpvragen").select("id").eq("kind_id", kind.id).eq("leerdoel_id", leerdoelId).neq("status", "afgerond").maybeSingle();
    hulpvraagId = bestaand?.id;
  }
  await db.from("oudermeldingen").update({ afgehandeld_op: new Date().toISOString() }).eq("kind_id", kind.id).eq("leerdoel_id", leerdoelId).is("afgehandeld_op", null);
  await audit(ouder.id, "hulpvraag-aangemaakt", hulpvraagId);
  revalidatePath("/ouder", "layout");
  redirect(`/ouder/hulp/${encodeURIComponent(leerdoelId)}?kind=${kind.id}&verstuurd=1`);
}

/** Melding sluiten zonder tutor ("Probeer eerst een tussenstap"). */
export async function sluitMelding(form: FormData) {
  const ouder = await vereisOuder();
  if (!(await isOuderOntgrendeld(ouder.id))) redirect("/ouder/ontgrendel?terug=/ouder");
  const kind = await haalEigenKind(String(form.get("kindId") ?? ""));
  if (!kind) return;
  await createAdminClient()
    .from("oudermeldingen")
    .update({ afgehandeld_op: new Date().toISOString() })
    .eq("kind_id", kind.id)
    .eq("ouder_id", ouder.id)
    .eq("leerdoel_id", String(form.get("leerdoelId") ?? ""))
    .is("afgehandeld_op", null);
  revalidatePath("/ouder", "layout");
  redirect(`/ouder?kind=${kind.id}`);
}
