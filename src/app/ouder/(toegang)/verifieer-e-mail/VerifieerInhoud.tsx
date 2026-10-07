"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import type { FormStatus } from "@/components/mees/Formulier";
import { SecundaireKnop } from "@/components/mees/Knoppen";
import { stuurBevestigingOpnieuw } from "../../acties";

export function VerifieerInhoud() {
  const ongeldig = useSearchParams().get("link") === "ongeldig";
  const [status, actie, bezig] = useActionState<FormStatus>(stuurBevestigingOpnieuw, {});
  return (
    <div className="flex flex-col gap-5">
      {ongeldig ? (
        <Melding soort="fout">De link is niet geldig of is verlopen. Log in om een nieuwe mail te krijgen, of maak opnieuw een account aan.</Melding>
      ) : (
        <Melding>Geen mail? Kijk ook bij ongewenste berichten. De mail kan een paar minuten onderweg zijn.</Melding>
      )}
      {status.melding && (
        <p role="status" className={status.gelukt ? "font-semibold text-succes" : "font-semibold text-probeer-opnieuw"}>
          {status.melding}
        </p>
      )}
      <form action={actie}>
        <SecundaireKnop type="submit" disabled={bezig} className="w-full">
          {bezig ? "Even wachten…" : "Stuur de mail opnieuw"}
        </SecundaireKnop>
      </form>
      <p className="text-center">
        Al bevestigd?{" "}
        <Link href="/ouder/inloggen" className="font-bold text-actie-blauw underline underline-offset-4">
          Inloggen
        </Link>
      </p>
    </div>
  );
}
