import "server-only";
import { headers } from "next/headers";
import { z } from "zod";

// Gedeelde invoerregels voor ouder- en tutoraccounts.

export async function herkomst() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Alleen interne paden als terugadres (geen open redirect). */
export function veiligTerug(waarde: FormDataEntryValue | null, standaard: string) {
  const pad = typeof waarde === "string" ? waarde : "";
  return pad.startsWith("/") && !pad.startsWith("//") && !pad.startsWith("/\\") ? pad : standaard;
}

export const emailSchema = z.email({ error: "Vul een geldig e-mailadres in." }).max(254);
export const wachtwoordSchema = z
  .string()
  .min(10, { error: "Gebruik minstens 10 tekens." })
  .max(72, { error: "Gebruik hoogstens 72 tekens." })
  .regex(/[A-Za-z]/, { error: "Gebruik minstens één letter." })
  .regex(/\d/, { error: "Gebruik minstens één cijfer." });
