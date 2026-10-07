"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { InvoerVeld, type FormStatus } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { ontgrendel } from "../../acties";

export function OntgrendelFormulier() {
  const terug = useSearchParams().get("terug") ?? "/ouder";
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(ontgrendel, {});
  return (
    <form action={actie} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="terug" value={terug} />
      <InvoerVeld label="Wachtwoord" name="wachtwoord" type="password" autoComplete="current-password" required autoFocus fout={status.fouten?.wachtwoord} />
      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full">
        <Icoon naam="slot" />
        {bezig ? "Even wachten…" : "Open ouderoverzicht"}
      </PrimaireKnop>
      <Link href="/profielen" className="self-center rounded-[8px] px-1 py-2 font-bold text-actie-blauw underline underline-offset-4">
        Terug naar de profielen
      </Link>
    </form>
  );
}
