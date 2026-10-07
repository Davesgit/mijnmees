"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { InvoerVeld, type FormStatus } from "@/components/mees/Formulier";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { kiesNieuwWachtwoord } from "../../acties";

export function NieuwWachtwoordFormulier() {
  const ongeldig = useSearchParams().get("link") === "ongeldig";
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(kiesNieuwWachtwoord, {});
  if (ongeldig) {
    return (
      <div className="flex flex-col gap-5">
        <Melding soort="fout">Deze link is niet geldig of is verlopen.</Melding>
        <Link href="/ouder/wachtwoord-herstellen" className="self-center font-bold text-actie-blauw underline underline-offset-4">
          Vraag een nieuwe herstelmail aan
        </Link>
      </div>
    );
  }
  return (
    <form action={actie} className="flex flex-col gap-5" noValidate>
      {status.melding && <Melding soort="fout">{status.melding}</Melding>}
      <InvoerVeld label="Nieuw wachtwoord" name="wachtwoord" type="password" autoComplete="new-password" required fout={status.fouten?.wachtwoord} hulp="Minstens 10 tekens, met letters en cijfers." />
      <InvoerVeld label="Nieuw wachtwoord nogmaals" name="herhaal" type="password" autoComplete="new-password" required fout={status.fouten?.herhaal} />
      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full">
        {bezig ? "Even wachten…" : "Bewaar wachtwoord"}
      </PrimaireKnop>
    </form>
  );
}
