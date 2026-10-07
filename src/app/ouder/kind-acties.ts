"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormStatus } from "@/components/mees/Formulier";
import { avatars, TOESTEMMING_VERSIE } from "@/lib/kinderen";
import { isOuderOntgrendeld, wisKindCookie, zetKindCookie, leesKindCookie } from "@/lib/server/cookies";
import { audit, haalActiefKind, haalEigenKind, vereisOuder } from "@/lib/server/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const avatarIds = avatars.map((a) => a.id) as [string, ...string[]];

const kindSchema = z.object({
  voornaam: z
    .string()
    .trim()
    .min(1, { error: "Vul een voornaam in." })
    .max(30, { error: "Gebruik hoogstens 30 tekens." })
    .regex(/^[\p{L}\p{M}' -]+$/u, { error: "Gebruik alleen letters, spaties of een koppelteken." }),
  groep: z.coerce.number().int().min(5, { error: "Kies groep 5, 6, 7 of 8." }).max(8, { error: "Kies groep 5, 6, 7 of 8." }),
  avatar: z.enum(avatarIds, { error: "Kies een dier." }),
});

export type KindToevoegenStatus = FormStatus & { kindId?: string; meenemen?: boolean };

export async function kindToevoegen(_: KindToevoegenStatus, form: FormData): Promise<KindToevoegenStatus> {
  const ouder = await vereisOuder("/ouder/kind-toevoegen");
  const waarden = { voornaam: String(form.get("voornaam") ?? ""), groep: String(form.get("groep") ?? ""), avatar: String(form.get("avatar") ?? "") };
  const invoer = kindSchema.safeParse(waarden);
  if (!invoer.success) {
    const fouten: Record<string, string> = {};
    for (const i of invoer.error.issues) fouten[String(i.path[0])] ??= i.message;
    return { fouten, waarden };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kinderen")
    .insert({ ouder_id: ouder.id, voornaam: invoer.data.voornaam, groep: invoer.data.groep, avatar: invoer.data.avatar })
    .select("id")
    .single();
  if (error || !data) return { melding: "Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.", waarden };

  await audit(ouder.id, "kind-toegevoegd", data.id);
  await zetKindCookie(data.id);
  revalidatePath("/profielen");
  return { gelukt: true, kindId: data.id, meenemen: form.get("meenemen") === "on" };
}

/** Kies welk kind op dit apparaat gaat oefenen. */
export async function kiesKind(form: FormData) {
  await vereisOuder("/profielen");
  const kind = await haalEigenKind(String(form.get("kindId") ?? ""));
  if (!kind) redirect("/profielen");
  await zetKindCookie(kind.id);
  redirect("/kind/start");
}

export async function wisselProfiel() {
  await wisKindCookie();
  redirect("/profielen");
}

/** Een kind mag alleen de eigen avatar wijzigen (P03). */
export async function bewaarAvatar(_: FormStatus, form: FormData): Promise<FormStatus> {
  const kind = await haalActiefKind();
  if (!kind) return { melding: "Kies eerst je profiel." };
  const avatar = z.enum(avatarIds).safeParse(form.get("avatar"));
  if (!avatar.success) return { melding: "Kies een avatar." };
  const supabase = await createClient();
  const { error } = await supabase.from("kinderen").update({ avatar: avatar.data }).eq("id", kind.id);
  if (error) return { melding: "Dit lukt nu niet. Probeer het nog eens." };
  revalidatePath("/kind", "layout");
  return { gelukt: true, melding: "Je avatar is bewaard." };
}

async function vereisOntgrendeldVoorActie() {
  const ouder = await vereisOuder();
  if (!(await isOuderOntgrendeld(ouder.id))) redirect("/ouder/ontgrendel?terug=/ouder/instellingen");
  return ouder;
}

/** Ouder wijzigt voornaam, groep, avatar en tutortoestemming van een eigen kind (O05). */
export async function kindBijwerken(_: FormStatus, form: FormData): Promise<FormStatus> {
  const ouder = await vereisOntgrendeldVoorActie();
  const kind = await haalEigenKind(String(form.get("kindId") ?? ""));
  if (!kind) return { melding: "Dit profiel hoort niet bij je account." };
  const invoer = kindSchema.safeParse({ voornaam: form.get("voornaam"), groep: form.get("groep"), avatar: form.get("avatar") });
  if (!invoer.success) {
    const fouten: Record<string, string> = {};
    for (const i of invoer.error.issues) fouten[String(i.path[0])] ??= i.message;
    return { fouten };
  }
  const tutorhulp = form.get("tutorhulp") === "on";

  const supabase = await createClient();
  const { data: huidig } = await supabase.from("kinderen").select("tutorhulp_toegestaan").eq("id", kind.id).single();
  const { error } = await supabase
    .from("kinderen")
    .update({ ...invoer.data, tutorhulp_toegestaan: tutorhulp })
    .eq("id", kind.id);
  if (error) return { melding: "Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens." };

  if (huidig && huidig.tutorhulp_toegestaan !== tutorhulp) {
    await supabase
      .from("toestemmingen")
      .insert({ kind_id: kind.id, ouder_id: ouder.id, soort: "tutorhulp", waarde: tutorhulp, beleid_versie: TOESTEMMING_VERSIE });
  }
  await audit(ouder.id, "kind-bijgewerkt", kind.id);
  revalidatePath("/ouder", "layout");
  return { gelukt: true, melding: `Het profiel van ${invoer.data.voornaam} is bewaard.` };
}

export async function emailvoorkeurenBewaren(_: FormStatus, form: FormData): Promise<FormStatus> {
  const ouder = await vereisOntgrendeldVoorActie();
  const supabase = await createClient();
  const { error } = await supabase
    .from("ouders")
    .update({ email_uitleg: form.get("email_uitleg") === "on", email_lessen: form.get("email_lessen") === "on" })
    .eq("id", ouder.id);
  if (error) return { melding: "Dit lukt nu niet. Probeer het nog eens." };
  return { gelukt: true, melding: "Je instellingen zijn bewaard." };
}

/** Verwijdert een kinderprofiel met alle voortgang (O06). Onomkeerbaar; ouder bevestigt met de voornaam. */
export async function kindVerwijderen(_: FormStatus, form: FormData): Promise<FormStatus> {
  const ouder = await vereisOntgrendeldVoorActie();
  const kind = await haalEigenKind(String(form.get("kindId") ?? ""));
  if (!kind) return { melding: "Dit profiel hoort niet bij je account." };
  if (String(form.get("bevestiging") ?? "").trim().toLowerCase() !== kind.voornaam.toLowerCase()) {
    return { fouten: { bevestiging: `Typ ${kind.voornaam} om te bevestigen.` } };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("kinderen").delete().eq("id", kind.id);
  if (error) return { melding: "Dit lukt nu niet. Probeer het nog eens." };
  if ((await leesKindCookie()) === kind.id) await wisKindCookie();
  await audit(ouder.id, "kind-verwijderd", kind.id);
  revalidatePath("/ouder", "layout");
  return { gelukt: true, melding: `Het profiel van ${kind.voornaam} en de voortgang zijn verwijderd.` };
}

/** Verwijdert het hele ouderaccount met alle kinderprofielen. */
export async function accountVerwijderen(_: FormStatus, form: FormData): Promise<FormStatus> {
  const ouder = await vereisOntgrendeldVoorActie();
  if (String(form.get("bevestiging") ?? "").trim().toUpperCase() !== "VERWIJDER") {
    return { fouten: { bevestiging: "Typ VERWIJDER om te bevestigen." } };
  }
  await audit(ouder.id, "account-verwijderd");
  const { error } = await createAdminClient().auth.admin.deleteUser(ouder.id);
  if (error) return { melding: "Dit lukt nu niet. Probeer het nog eens." };
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  await wisKindCookie();
  redirect("/?account=verwijderd");
}
