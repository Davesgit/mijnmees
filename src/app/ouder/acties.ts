"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormStatus } from "@/components/mees/Formulier";
import { OUDERVERKLARING_VERSIE } from "@/lib/kinderen";
import { ontgrendelOuder, vergrendelOuder, wisKindCookie } from "@/lib/server/cookies";
import { audit, haalOuder } from "@/lib/server/dal";
import { createClient } from "@/lib/supabase/server";

const WACHT_EMAIL = "mees_wacht_email";

async function herkomst() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Alleen interne paden als terugadres (geen open redirect). */
function veiligTerug(waarde: FormDataEntryValue | null, standaard: string) {
  const pad = typeof waarde === "string" ? waarde : "";
  return pad.startsWith("/") && !pad.startsWith("//") && !pad.startsWith("/\\") ? pad : standaard;
}

const emailSchema = z.email({ error: "Vul een geldig e-mailadres in." }).max(254);
const wachtwoordSchema = z
  .string()
  .min(10, { error: "Gebruik minstens 10 tekens." })
  .max(72, { error: "Gebruik hoogstens 72 tekens." })
  .regex(/[A-Za-z]/, { error: "Gebruik minstens één letter." })
  .regex(/\d/, { error: "Gebruik minstens één cijfer." });

export async function registreer(_: FormStatus, form: FormData): Promise<FormStatus> {
  const waarden = { email: String(form.get("email") ?? "").trim() };
  const fouten: Record<string, string> = {};
  const email = emailSchema.safeParse(waarden.email);
  if (!email.success) fouten.email = email.error.issues[0].message;
  const wachtwoord = wachtwoordSchema.safeParse(String(form.get("wachtwoord") ?? ""));
  if (!wachtwoord.success) fouten.wachtwoord = wachtwoord.error.issues[0].message;
  if (form.get("wachtwoord") !== form.get("herhaal")) fouten.herhaal = "De wachtwoorden zijn niet hetzelfde.";
  if (form.get("verklaring") !== "on") fouten.verklaring = "Bevestig dat je ouder of verzorger bent.";
  if (Object.keys(fouten).length) return { fouten, waarden };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: email.data!,
    password: wachtwoord.data!,
    options: {
      emailRedirectTo: `${await herkomst()}/auth/bevestig?next=/ouder/kind-toevoegen`,
      data: { verklaring_versie: OUDERVERKLARING_VERSIE },
    },
  });
  if (error) {
    if (error.code === "weak_password") return { fouten: { wachtwoord: "Kies een sterker wachtwoord." }, waarden };
    if (error.code === "over_email_send_rate_limit" || error.status === 429)
      return { melding: "Er zijn net te veel mails verstuurd. Probeer het over een paar minuten opnieuw.", waarden };
    return { melding: "Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.", waarden };
  }

  // E-mailadres niet in de URL zetten: kort bewaren in een cookie voor 'Stuur opnieuw'.
  (await cookies()).set(WACHT_EMAIL, email.data!, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60, path: "/ouder" });
  redirect("/ouder/verifieer-e-mail");
}

export async function stuurBevestigingOpnieuw(): Promise<FormStatus> {
  const email = (await cookies()).get(WACHT_EMAIL)?.value;
  if (!email) return { melding: "Maak opnieuw een account aan of log in." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await herkomst()}/auth/bevestig?next=/ouder/kind-toevoegen` },
  });
  if (error) return { melding: "Wacht even voordat je opnieuw een mail aanvraagt." };
  return { gelukt: true, melding: "We hebben de mail opnieuw verstuurd." };
}

export async function inloggen(_: FormStatus, form: FormData): Promise<FormStatus> {
  const waarden = { email: String(form.get("email") ?? "").trim() };
  const email = emailSchema.safeParse(waarden.email);
  const wachtwoord = String(form.get("wachtwoord") ?? "");
  if (!email.success || !wachtwoord) return { melding: "Vul je e-mailadres en wachtwoord in.", waarden };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password: wachtwoord });
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return { melding: "Bevestig eerst je e-mailadres via de link in je mail. Geen mail? Kijk ook bij ongewenste berichten.", waarden };
    }
    return { melding: "Inloggen lukt niet met deze gegevens. Controleer ze of herstel je wachtwoord.", waarden };
  }
  await wisKindCookie();
  await ontgrendelOuder(data.user.id);
  await audit(data.user.id, "inloggen");
  redirect(veiligTerug(form.get("terug"), "/profielen"));
}

/** Opnieuw het wachtwoord invoeren om de ouderomgeving te openen. */
export async function ontgrendel(_: FormStatus, form: FormData): Promise<FormStatus> {
  const ouder = await haalOuder();
  if (!ouder) redirect("/ouder/inloggen");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: ouder.email, password: String(form.get("wachtwoord") ?? "") });
  if (error) return { fouten: { wachtwoord: "Dit wachtwoord klopt niet." } };
  await ontgrendelOuder(ouder.id);
  redirect(veiligTerug(form.get("terug"), "/ouder"));
}

export async function vraagHerstelAan(_: FormStatus, form: FormData): Promise<FormStatus> {
  const waarden = { email: String(form.get("email") ?? "").trim() };
  const email = emailSchema.safeParse(waarden.email);
  if (!email.success) return { fouten: { email: email.error.issues[0].message }, waarden };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${await herkomst()}/auth/bevestig?next=/ouder/nieuw-wachtwoord`,
  });
  // Altijd dezelfde melding: niet verraden of er een account bij dit adres hoort.
  return { gelukt: true, melding: "Als er een account bij dit adres hoort, is een herstelmail verstuurd." };
}

export async function kiesNieuwWachtwoord(_: FormStatus, form: FormData): Promise<FormStatus> {
  const ouder = await haalOuder();
  if (!ouder) return { melding: "Open een geldige herstelmail. De link is tijdelijk geldig." };
  const wachtwoord = wachtwoordSchema.safeParse(String(form.get("wachtwoord") ?? ""));
  if (!wachtwoord.success) return { fouten: { wachtwoord: wachtwoord.error.issues[0].message } };
  if (form.get("wachtwoord") !== form.get("herhaal")) return { fouten: { herhaal: "De wachtwoorden zijn niet hetzelfde." } };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: wachtwoord.data });
  if (error) {
    if (error.code === "same_password") return { fouten: { wachtwoord: "Kies een ander wachtwoord dan je oude." } };
    return { melding: "Dit lukt nu niet. Probeer het nog eens of vraag een nieuwe herstelmail aan." };
  }
  await audit(ouder.id, "wachtwoord-gewijzigd");
  await supabase.auth.signOut({ scope: "others" });
  await ontgrendelOuder(ouder.id);
  redirect("/profielen");
}

export async function uitloggen(form: FormData) {
  const supabase = await createClient();
  const overal = form.get("overal") === "ja";
  await supabase.auth.signOut({ scope: overal ? "global" : "local" });
  await wisKindCookie();
  await vergrendelOuder();
  redirect("/ouder/inloggen?uitgelogd=1");
}
