import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { haalOuder } from "./dal";

// Rollen komen nooit uit de browser: tutorstatus en beheerdersrol staan in de database en worden hier per verzoek gelezen.

export type TutorStatus = "aangemeld" | "goedgekeurd" | "afgewezen" | "geschorst";
export type Tutor = { id: string; email: string; voornaam: string; achternaam: string; status: TutorStatus };

/** De ingelogde gebruiker als tutor (met zijn aanmeldstatus), of null als er geen aanmelding is. */
export const haalTutor = cache(async (): Promise<Tutor | null> => {
  const gebruiker = await haalOuder();
  if (!gebruiker) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("tutors").select("id, voornaam, achternaam, status").eq("id", gebruiker.id).maybeSingle();
  return data ? { ...(data as Omit<Tutor, "email">), email: gebruiker.email } : null;
});

/** Alleen goedgekeurde tutors komen bij hulpvragen en uitleg. */
export async function vereisTutor(terug = "/tutor"): Promise<Tutor> {
  const gebruiker = await haalOuder();
  if (!gebruiker) redirect(`/tutor/inloggen?terug=${encodeURIComponent(terug)}`);
  const tutor = await haalTutor();
  if (!tutor) redirect("/tutor/aanmelden");
  if (tutor.status !== "goedgekeurd") redirect("/tutor");
  return tutor;
}

export const isBeheerder = cache(async (): Promise<boolean> => {
  const gebruiker = await haalOuder();
  if (!gebruiker) return false;
  const { data } = await createAdminClient().from("beheerders").select("user_id").eq("user_id", gebruiker.id).maybeSingle();
  return Boolean(data);
});

export async function vereisBeheerder(): Promise<{ id: string; email: string }> {
  const gebruiker = await haalOuder();
  if (!gebruiker) redirect("/tutor/inloggen?terug=/beheer");
  if (!(await isBeheerder())) redirect("/");
  return { id: gebruiker.id, email: gebruiker.email };
}
