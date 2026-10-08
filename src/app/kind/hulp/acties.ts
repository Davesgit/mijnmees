"use server";

import { revalidatePath } from "next/cache";
import { tutorhulpMogelijk } from "@/features/tutorhulp/criteria";
import { geschiktheidVoorKind } from "@/features/tutorhulp/server";
import { audit, haalActiefKind, haalOuder } from "@/lib/server/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export type MeldStatus = { gelukt?: boolean; melding?: string };

/** H01: het kind laat de ouder weten dat extra uitleg kan helpen. Dit is nog geen tutoraanvraag. */
export async function laatOuderWeten(_: MeldStatus, form: FormData): Promise<MeldStatus> {
  const [ouder, kind] = await Promise.all([haalOuder(), haalActiefKind()]);
  if (!ouder || !kind) return { melding: "Vraag je ouder om in te loggen. Dan kan je ouder meekijken." };
  const leerdoelId = String(form.get("leerdoelId") ?? "");
  if (!tutorhulpMogelijk(leerdoelId)) return { melding: "Voor dit onderdeel is nog geen extra uitleg." };

  const geschiktheid = await geschiktheidVoorKind(kind.id, leerdoelId);
  if (!geschiktheid?.geschikt) return { melding: "Probeer eerst de uitleg en een soortgelijke vraag op een andere dag." };

  // Via de server (criteria hierboven gecontroleerd); de unieke index voorkomt een tweede open melding.
  const { error } = await createAdminClient().from("oudermeldingen").insert({
    ouder_id: ouder.id,
    kind_id: kind.id,
    leerdoel_id: leerdoelId,
    bewijs: geschiktheid.bewijs,
    criteria_versie: geschiktheid.bewijs.criteriaVersie,
  });
  if (error && error.code !== "23505") return { melding: "Dit lukt nu niet. Probeer het nog eens." };
  await audit(ouder.id, "oudermelding-tutorhulp", kind.id);
  revalidatePath("/ouder", "layout");
  return { gelukt: true, melding: "Je ouder ziet het in Mees. Je kunt ondertussen iets anders oefenen." };
}
