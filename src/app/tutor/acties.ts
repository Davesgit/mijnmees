"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormStatus } from "@/components/mees/Formulier";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { kiesControleVraag, tutorhulpMogelijk } from "@/features/tutorhulp/criteria";
import { AUDIO_BUCKET, bordSchema, claimHulpvraag, gezienDoorKind, haalEigenUitleg } from "@/features/tutorhulp/server";
import { audit, haalOuder } from "@/lib/server/dal";
import { emailSchema, herkomst, veiligTerug, wachtwoordSchema } from "@/lib/server/invoer";
import { haalTutor, vereisTutor, type Tutor } from "@/lib/server/rollen";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Versie van de tutorafspraken bij aanmelding. */
const TUTORAFSPRAKEN_VERSIE = "concept-2026-10-10";

const aanmeldSchema = z.object({
  voornaam: z.string().trim().min(1, { error: "Vul je voornaam in." }).max(40),
  achternaam: z.string().trim().min(1, { error: "Vul je achternaam in." }).max(60),
  ervaring: z.string().trim().min(20, { error: "Vertel iets meer over je ervaring (minstens 20 tekens)." }).max(1500),
  motivatie: z.string().trim().min(20, { error: "Vertel iets meer over waarom je wilt helpen (minstens 20 tekens)." }).max(1500),
});

function leesAanmelding(form: FormData) {
  const waarden = {
    voornaam: String(form.get("voornaam") ?? ""),
    achternaam: String(form.get("achternaam") ?? ""),
    ervaring: String(form.get("ervaring") ?? ""),
    motivatie: String(form.get("motivatie") ?? ""),
    email: String(form.get("email") ?? "").trim(),
  };
  const fouten: Record<string, string> = {};
  const invoer = aanmeldSchema.safeParse(waarden);
  if (!invoer.success) for (const i of invoer.error.issues) fouten[String(i.path[0])] ??= i.message;
  if (form.get("afspraken") !== "on") fouten.afspraken = "Ga akkoord met de afspraken voor tutors.";
  return { waarden, fouten, invoer: invoer.success ? invoer.data : null };
}

/** Aanmelden zonder account: account aanmaken + aanmelding (status 'aangemeld'). */
export async function registreerTutor(_: FormStatus, form: FormData): Promise<FormStatus> {
  const { waarden, fouten, invoer } = leesAanmelding(form);
  const email = emailSchema.safeParse(waarden.email);
  if (!email.success) fouten.email = email.error.issues[0].message;
  const wachtwoord = wachtwoordSchema.safeParse(String(form.get("wachtwoord") ?? ""));
  if (!wachtwoord.success) fouten.wachtwoord = wachtwoord.error.issues[0].message;
  if (form.get("wachtwoord") !== form.get("herhaal")) fouten.herhaal = "De wachtwoorden zijn niet hetzelfde.";
  if (Object.keys(fouten).length || !invoer) return { fouten, waarden };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data!,
    password: wachtwoord.data!,
    options: { emailRedirectTo: `${await herkomst()}/auth/bevestig?next=/tutor` },
  });
  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.status === 429)
      return { melding: "Er zijn net te veel mails verstuurd. Probeer het over een paar minuten opnieuw.", waarden };
    return { melding: "Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.", waarden };
  }
  // Bestaat het adres al, dan geeft Supabase een gebruiker zonder identiteiten terug: niets opslaan, zelfde melding.
  if (data.user && (data.user.identities?.length ?? 0) > 0) {
    await createAdminClient()
      .from("tutors")
      .insert({ id: data.user.id, ...invoer, afspraken_versie: TUTORAFSPRAKEN_VERSIE, status: "aangemeld" });
    await audit(data.user.id, "tutor-aangemeld");
  }
  redirect("/tutor/aanmelden?verstuurd=1");
}

/** Aanmelden met een bestaand Mees-account (bijvoorbeeld een ouder die ook tutor wil worden). */
export async function meldAanAlsTutor(_: FormStatus, form: FormData): Promise<FormStatus> {
  const gebruiker = await haalOuder();
  if (!gebruiker) redirect("/tutor/inloggen?terug=/tutor/aanmelden");
  if (await haalTutor()) redirect("/tutor");
  const { waarden, fouten, invoer } = leesAanmelding(form);
  if (Object.keys(fouten).length || !invoer) return { fouten, waarden };
  const supabase = await createClient();
  const { error } = await supabase.from("tutors").insert({ id: gebruiker.id, ...invoer, afspraken_versie: TUTORAFSPRAKEN_VERSIE });
  if (error && error.code !== "23505") return { melding: "Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.", waarden };
  await audit(gebruiker.id, "tutor-aangemeld");
  redirect("/tutor");
}

export async function tutorInloggen(_: FormStatus, form: FormData): Promise<FormStatus> {
  const waarden = { email: String(form.get("email") ?? "").trim() };
  const email = emailSchema.safeParse(waarden.email);
  const wachtwoord = String(form.get("wachtwoord") ?? "");
  if (!email.success || !wachtwoord) return { melding: "Vul je e-mailadres en wachtwoord in.", waarden };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password: wachtwoord });
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") return { melding: "Bevestig eerst je e-mailadres via de link in je mail.", waarden };
    return { melding: "Inloggen lukt niet met deze gegevens.", waarden };
  }
  await audit(data.user.id, "tutor-inloggen");
  redirect(veiligTerug(form.get("terug"), "/tutor"));
}

export async function tutorUitloggen() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/tutor/inloggen?uitgelogd=1");
}

/* ---------- Hulpvragen ---------- */

const uuid = z.uuid();

export async function pakOp(form: FormData) {
  const tutor = await vereisTutor("/tutor/hulpvragen");
  const id = uuid.safeParse(form.get("hulpvraagId"));
  if (!id.success) redirect("/tutor/hulpvragen");
  const uitkomst = await claimHulpvraag(tutor, id.data);
  if (uitkomst === "bezet") redirect("/tutor/hulpvragen?bezet=1");
  await audit(tutor.id, "hulpvraag-opgepakt", id.data);
  revalidatePath("/tutor", "layout");
  redirect(`/tutor/hulpvragen/${id.data}`);
}

async function eigenHulpvraag(tutor: Tutor, id: string) {
  const { data } = await createAdminClient().from("hulpvragen").select("id, kind_id, leerdoel_id, status, tutor_id").eq("id", id).maybeSingle();
  return data && data.tutor_id === tutor.id ? data : null;
}

export async function geefTerug(form: FormData) {
  const tutor = await vereisTutor();
  const id = String(form.get("hulpvraagId") ?? "");
  const hv = await eigenHulpvraag(tutor, id);
  if (hv?.status === "in-behandeling") {
    await createAdminClient().from("hulpvragen").update({ status: "nieuw", tutor_id: null, geclaimd_op: null, claim_tot: null }).eq("id", id).eq("tutor_id", tutor.id);
    await audit(tutor.id, "hulpvraag-teruggegeven", id);
  }
  revalidatePath("/tutor", "layout");
  redirect("/tutor/hulpvragen");
}

/** Uitleg koppelen aan de hulpvraag + een nieuwe controlevraag kiezen die het kind nog niet maakte. */
async function verstuurNaarKind(tutor: Tutor, hulpvraagId: string, uitlegId: string) {
  const hv = await eigenHulpvraag(tutor, hulpvraagId);
  if (!hv || hv.status === "afgerond") return false;
  const gezien = await gezienDoorKind(hv.kind_id, hv.leerdoel_id);
  const controle = kiesControleVraag(hv.leerdoel_id, gezien);
  const { error } = await createAdminClient()
    .from("hulpvragen")
    .update({ status: "uitleg-verstuurd", uitleg_id: uitlegId, controle_vraag_id: controle?.id ?? null })
    .eq("id", hulpvraagId)
    .eq("tutor_id", tutor.id);
  return !error;
}

export async function maakUitleg(form: FormData) {
  const tutor = await vereisTutor();
  const hulpvraagId = String(form.get("hulpvraagId") ?? "");
  let leerdoelId = String(form.get("leerdoelId") ?? "");
  if (hulpvraagId) {
    const hv = await eigenHulpvraag(tutor, hulpvraagId);
    if (!hv) redirect("/tutor/hulpvragen");
    leerdoelId = hv.leerdoel_id;
  }
  if (!tutorhulpMogelijk(leerdoelId)) redirect("/tutor/uitlegbibliotheek");
  const { data, error } = await createAdminClient()
    .from("uitleg")
    .insert({ tutor_id: tutor.id, leerdoel_id: leerdoelId, hulpvraag_id: hulpvraagId || null, titel: `Uitleg: ${leerdoelNaam(leerdoelId)}` })
    .select("id")
    .single();
  if (error || !data) redirect(hulpvraagId ? `/tutor/hulpvragen/${hulpvraagId}?fout=1` : "/tutor/uitlegbibliotheek?fout=1");
  await audit(tutor.id, "uitleg-aangemaakt", data.id);
  redirect(`/tutor/uitleg/${data.id}/bewerken`);
}

export async function koppelUitleg(form: FormData) {
  const tutor = await vereisTutor();
  const hulpvraagId = String(form.get("hulpvraagId") ?? "");
  const uitlegId = String(form.get("uitlegId") ?? "");
  const hv = await eigenHulpvraag(tutor, hulpvraagId);
  const { data: uitleg } = await createAdminClient().from("uitleg").select("id, leerdoel_id, status").eq("id", uitlegId).maybeSingle();
  if (!hv || !uitleg || uitleg.status !== "gepubliceerd" || uitleg.leerdoel_id !== hv.leerdoel_id) redirect(`/tutor/hulpvragen/${hulpvraagId}?fout=1`);
  await verstuurNaarKind(tutor, hulpvraagId, uitlegId);
  await audit(tutor.id, "uitleg-gekoppeld", hulpvraagId);
  revalidatePath("/tutor", "layout");
  redirect(`/tutor/hulpvragen/${hulpvraagId}/resultaat`);
}

/* ---------- Uitleg opnemen en bewaren ---------- */

const mimeSchema = z.enum(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/aac", "audio/wav"]);
const extensie: Record<z.infer<typeof mimeSchema>, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/aac": "aac",
  "audio/wav": "wav",
};

/** Kortlevende uploadlink naar de private bucket, alleen voor een eigen concept. */
export async function vraagUploadLink(uitlegId: string, mime: string): Promise<{ pad: string; token: string } | null> {
  const tutor = await vereisTutor();
  const uitleg = await haalEigenUitleg(tutor, uitlegId);
  const type = mimeSchema.safeParse(mime.split(";")[0]);
  if (!uitleg || uitleg.status !== "concept" || !type.success) return null;
  const pad = `${uitleg.id}/${Date.now()}.${extensie[type.data]}`;
  const { data, error } = await createAdminClient().storage.from(AUDIO_BUCKET).createSignedUploadUrl(pad);
  if (error || !data) return null;
  return { pad, token: data.token };
}

const opnameSchema = z.object({
  uitlegId: z.uuid(),
  titel: z.string().trim().min(1).max(120),
  bord: bordSchema,
  audio: z.object({ pad: z.string().max(200), mime: z.string().max(60), duurMs: z.number().int().min(500).max(900_000) }).nullable(),
});

/** Bewaart bord (en eventueel een nieuwe opname) als concept. Nooit automatisch versturen. */
export async function bewaarUitleg(invoer: z.infer<typeof opnameSchema>): Promise<{ ok: boolean; melding?: string }> {
  const tutor = await vereisTutor();
  const geldig = opnameSchema.safeParse(invoer);
  if (!geldig.success) return { ok: false, melding: "Het bord is te groot of bevat iets dat niet past." };
  const uitleg = await haalEigenUitleg(tutor, geldig.data.uitlegId);
  if (!uitleg || uitleg.status !== "concept") return { ok: false, melding: "Deze uitleg kun je niet meer aanpassen." };
  const { audio } = geldig.data;
  if (audio && !audio.pad.startsWith(`${uitleg.id}/`)) return { ok: false, melding: "Dit lukt nu niet. Probeer het nog eens." };

  const db = createAdminClient();
  const { error } = await db
    .from("uitleg")
    .update({
      titel: geldig.data.titel,
      bord: geldig.data.bord,
      ...(audio ? { audio_pad: audio.pad, audio_mime: audio.mime.split(";")[0], duur_ms: audio.duurMs, privacy_gecontroleerd: false } : {}),
      bijgewerkt_op: new Date().toISOString(),
    })
    .eq("id", uitleg.id)
    .eq("tutor_id", tutor.id);
  if (error) return { ok: false, melding: "Dit lukt nu niet. Je bord blijft staan. Probeer het nog eens." };
  // Een vervangen opname wordt niet bewaard.
  if (audio && uitleg.audioPad && uitleg.audioPad !== audio.pad) await db.storage.from(AUDIO_BUCKET).remove([uitleg.audioPad]);
  revalidatePath(`/tutor/uitleg/${uitleg.id}`, "layout");
  return { ok: true };
}

export type PubliceerStatus = FormStatus;

/** U05: na controle publiceren. Transcript en privacycontrole zijn verplicht. */
export async function publiceerUitleg(_: PubliceerStatus, form: FormData): Promise<PubliceerStatus> {
  const tutor = await vereisTutor();
  const uitleg = await haalEigenUitleg(tutor, String(form.get("uitlegId") ?? ""));
  if (!uitleg) return { melding: "Deze uitleg is niet gevonden." };
  const transcript = String(form.get("transcript") ?? "").trim();
  const waarden = { transcript };
  const fouten: Record<string, string> = {};
  if (transcript.length < 20) fouten.transcript = "Schrijf op wat je zegt (minstens 20 tekens). Kinderen kunnen dan meelezen.";
  if (transcript.length > 10000) fouten.transcript = "Het transcript is te lang.";
  if (form.get("privacy") !== "on") fouten.privacy = "Bevestig dat er geen namen of privégegevens in de uitleg staan.";
  if (!uitleg.audioPad || !uitleg.duurMs) fouten.opname = "Neem eerst de uitleg op.";
  const actie = String(form.get("actie") ?? "publiceer");

  const db = createAdminClient();
  if (actie === "concept") {
    await db.from("uitleg").update({ transcript: transcript.slice(0, 10000), bijgewerkt_op: new Date().toISOString() }).eq("id", uitleg.id).eq("tutor_id", tutor.id);
    return { gelukt: true, melding: "Het concept is bewaard. Er is nog niets verstuurd.", waarden };
  }
  if (Object.keys(fouten).length) return { fouten, waarden, melding: fouten.opname };

  const nu = new Date().toISOString();
  const { error } = await db
    .from("uitleg")
    .update({ transcript, privacy_gecontroleerd: true, status: "gepubliceerd", gepubliceerd_op: nu, bijgewerkt_op: nu })
    .eq("id", uitleg.id)
    .eq("tutor_id", tutor.id)
    .eq("status", "concept");
  if (error) return { melding: "Dit lukt nu niet. Probeer het nog eens.", waarden };
  if (uitleg.hulpvraagId) await verstuurNaarKind(tutor, uitleg.hulpvraagId, uitleg.id);
  await audit(tutor.id, "uitleg-gepubliceerd", uitleg.id);
  revalidatePath("/tutor", "layout");
  redirect(uitleg.hulpvraagId ? `/tutor/hulpvragen/${uitleg.hulpvraagId}/resultaat?verstuurd=1` : "/tutor/uitlegbibliotheek?gepubliceerd=1");
}

/** Gepubliceerde uitleg aanpassen = een nieuwe conceptversie (de gepubliceerde blijft wat kinderen zien). */
export async function nieuweVersie(form: FormData) {
  const tutor = await vereisTutor();
  const uitleg = await haalEigenUitleg(tutor, String(form.get("uitlegId") ?? ""));
  if (!uitleg) redirect("/tutor/uitlegbibliotheek");
  const { data } = await createAdminClient()
    .from("uitleg")
    .insert({ tutor_id: tutor.id, leerdoel_id: uitleg.leerdoelId, hulpvraag_id: null, titel: uitleg.titel, bord: { elementen: uitleg.bord.elementen ?? [], gebeurtenissen: [] }, transcript: uitleg.transcript })
    .select("id")
    .single();
  redirect(data ? `/tutor/uitleg/${data.id}/bewerken` : "/tutor/uitlegbibliotheek?fout=1");
}

/* ---------- Afronden ---------- */

const redenen = {
  "zelfstandig-gelukt": "De controlevraag lukte zelfstandig.",
  "met-hulp-gelukt": "De controlevraag lukte met hulp; geen verdere tutorhulp nodig.",
  "andere-hulp": "Een andere vorm van hulp past beter.",
  "geen-reactie": "Het kind heeft de uitleg of controlevraag niet gemaakt.",
} as const;

export async function rondAf(_: FormStatus, form: FormData): Promise<FormStatus> {
  const tutor = await vereisTutor();
  const id = String(form.get("hulpvraagId") ?? "");
  const reden = String(form.get("reden") ?? "") as keyof typeof redenen;
  const toelichting = String(form.get("toelichting") ?? "").trim().slice(0, 300);
  if (!(reden in redenen)) return { fouten: { reden: "Kies waarom je de hulpvraag afrondt." } };
  const hv = await eigenHulpvraag(tutor, id);
  if (!hv || hv.status === "afgerond") return { melding: "Deze hulpvraag kun je niet afronden." };
  const { error } = await createAdminClient()
    .from("hulpvragen")
    .update({ status: "afgerond", afgerond_op: new Date().toISOString(), afsluitreden: `${redenen[reden]}${toelichting ? ` ${toelichting}` : ""}` })
    .eq("id", id)
    .eq("tutor_id", tutor.id);
  if (error) return { melding: "Dit lukt nu niet. Probeer het nog eens." };
  await audit(tutor.id, "hulpvraag-afgerond", id);
  revalidatePath("/tutor", "layout");
  redirect("/tutor/hulpvragen?afgerond=1");
}

/** Vervolg: zelfde dossier, nieuwe uitleg mogelijk. Geen tweede aanvraag. */
export async function vervolgHulpvraag(form: FormData) {
  const tutor = await vereisTutor();
  const id = String(form.get("hulpvraagId") ?? "");
  const hv = await eigenHulpvraag(tutor, id);
  if (hv && hv.status === "uitleg-verstuurd") {
    await createAdminClient().from("hulpvragen").update({ status: "in-behandeling" }).eq("id", id).eq("tutor_id", tutor.id);
    await audit(tutor.id, "hulpvraag-vervolg", id);
  }
  revalidatePath("/tutor", "layout");
  redirect(`/tutor/hulpvragen/${id}`);
}
