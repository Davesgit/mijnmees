"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import type { FormStatus } from "@/components/mees/Formulier";
import { createAdminClient } from "@/lib/supabase/admin";

const looptijden = ["bespreken", "1-jaar", "2-jaar", "3-jaar", "5-jaar-of-langer"] as const;

const schema = z.object({
  naam: z.string().trim().min(1, { error: "Vul je naam in." }).max(100, { error: "Gebruik hoogstens 100 tekens." }),
  email: z.email({ error: "Vul een geldig e-mailadres in." }).max(254),
  organisatie: z.string().trim().max(150, { error: "Gebruik hoogstens 150 tekens." }),
  looptijd: z.enum(looptijden, { error: "Kies een looptijd." }),
  toelichting: z.string().trim().max(1000, { error: "Gebruik hoogstens 1000 tekens." }),
});

/**
 * Vrijblijvende aanmelding voor meerjarige steun. Geen betaling, geen nieuwsbrief.
 * Valideren, begrenzen (gehasht IP per dag), dubbele aanmelding herkennen; pas daarna een echte bevestiging.
 */
export async function meldAanAlsDonateur(_: FormStatus, form: FormData): Promise<FormStatus> {
  const waarden = Object.fromEntries(["naam", "email", "organisatie", "looptijd", "toelichting"].map((k) => [k, String(form.get(k) ?? "")]));
  // Onzichtbaar veld voor robots: ingevuld = stil negeren.
  if (String(form.get("website") ?? "")) return { gelukt: true, melding: "Bedankt voor je aanmelding. We nemen contact met je op." };

  const fouten: Record<string, string> = {};
  const invoer = schema.safeParse({ ...waarden, email: waarden.email.trim().toLowerCase() });
  if (!invoer.success) for (const i of invoer.error.issues) fouten[String(i.path[0])] ??= i.message;
  if (form.get("toestemming") !== "on") fouten.toestemming = "Geef toestemming om contact met je op te nemen over deze aanmelding.";
  if (Object.keys(fouten).length || !invoer.success) return { fouten, waarden };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  const bron = createHash("sha256").update(`${ip}|${new Date().toISOString().slice(0, 10)}|${process.env.MEES_COOKIE_SECRET ?? ""}`).digest("hex").slice(0, 32);

  const db = createAdminClient();
  const sinds = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: perBron }, { data: dubbel }] = await Promise.all([
    db.from("donateur_aanmeldingen").select("*", { count: "exact", head: true }).eq("bron", bron).gte("aangemaakt_op", sinds),
    db.from("donateur_aanmeldingen").select("id").eq("email", invoer.data.email).gte("aangemaakt_op", sinds).limit(1),
  ]);
  if (dubbel?.length) return { gelukt: true, melding: "We hadden je aanmelding al ontvangen. We nemen contact met je op." };
  if ((perBron ?? 0) >= 5) return { melding: "Er zijn vandaag al veel aanmeldingen vanaf dit apparaat. Probeer het morgen nog eens.", waarden };

  const { error } = await db.from("donateur_aanmeldingen").insert({
    naam: invoer.data.naam,
    email: invoer.data.email,
    organisatie: invoer.data.organisatie || null,
    looptijd: invoer.data.looptijd,
    toelichting: invoer.data.toelichting || null,
    toestemming_contact: true,
    bron,
  });
  if (error) return { melding: "Versturen lukt nu niet. Je invoer blijft staan. Probeer het nog eens.", waarden };
  return { gelukt: true, melding: "Bedankt voor je aanmelding. We nemen contact met je op." };
}
