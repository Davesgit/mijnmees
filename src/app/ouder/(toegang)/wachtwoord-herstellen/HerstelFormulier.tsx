"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { InvoerVeld, type FormStatus } from "@/components/mees/Formulier";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { vraagHerstelAan } from "../../acties";

export function HerstelFormulier() {
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(vraagHerstelAan, {});
  return (
    <form action={actie} className="flex flex-col gap-5" noValidate>
      {status.gelukt ? (
        <Melding soort="succes">{status.melding}</Melding>
      ) : (
        <p className="text-tekst-zacht">Als er een account bij dit adres hoort, krijg je een herstelmail.</p>
      )}
      <InvoerVeld label="E-mailadres" name="email" type="email" autoComplete="email" placeholder="jouw@email.nl" required defaultValue={status.waarden?.email} fout={status.fouten?.email} />
      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full">
        {bezig ? "Even wachten…" : "Stuur herstelmail"}
      </PrimaireKnop>
      <Link href="/ouder/inloggen" className="self-center rounded-[8px] px-1 py-2 font-bold text-actie-blauw underline underline-offset-4">
        Terug naar inloggen
      </Link>
    </form>
  );
}
