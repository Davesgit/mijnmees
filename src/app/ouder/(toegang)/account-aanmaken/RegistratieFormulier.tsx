"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { InvoerVeld, Vinkje, type FormStatus } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { registreer } from "../../acties";

export function RegistratieFormulier() {
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(registreer, {});
  return (
    <form action={actie} className="mt-8 flex flex-col gap-5" noValidate>
      {status.melding && <Melding soort="fout">{status.melding}</Melding>}
      <InvoerVeld label="E-mailadres" name="email" type="email" autoComplete="email" placeholder="jouw@email.nl" required defaultValue={status.waarden?.email} fout={status.fouten?.email} />
      <InvoerVeld
        label="Wachtwoord"
        name="wachtwoord"
        type="password"
        autoComplete="new-password"
        required
        fout={status.fouten?.wachtwoord}
        hulp="Minstens 10 tekens, met letters en cijfers."
      />
      <InvoerVeld label="Wachtwoord nogmaals" name="herhaal" type="password" autoComplete="new-password" required fout={status.fouten?.herhaal} />
      <Vinkje naam="verklaring" fout={status.fouten?.verklaring}>
        Ik ben ouder of verzorger en heb de{" "}
        <Link href="/privacy" target="_blank" className="font-semibold text-actie-blauw underline underline-offset-4">
          privacyinformatie
        </Link>{" "}
        gelezen.
      </Vinkje>
      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full">
        {bezig ? "Even wachten…" : "Account aanmaken"}
        {!bezig && <Icoon naam="pijl-rechts" />}
      </PrimaireKnop>
    </form>
  );
}
