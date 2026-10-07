"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { InvoerVeld, type FormStatus } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { inloggen } from "../../acties";

export function InlogFormulier() {
  const params = useSearchParams();
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(inloggen, {});
  return (
    <form action={actie} className="flex flex-col gap-5" noValidate>
      {params.get("uitgelogd") && !status.melding && <Melding soort="succes">Je bent uitgelogd.</Melding>}
      {status.melding && <Melding soort="fout">{status.melding}</Melding>}
      <input type="hidden" name="terug" value={params.get("terug") ?? ""} />
      <InvoerVeld label="E-mailadres" name="email" type="email" autoComplete="email" placeholder="jouw@email.nl" required defaultValue={status.waarden?.email} />
      <div className="flex flex-col gap-2">
        <InvoerVeld label="Wachtwoord" name="wachtwoord" type="password" autoComplete="current-password" required />
        <Link href="/ouder/wachtwoord-herstellen" className="self-end rounded-[8px] px-1 py-2 font-semibold text-actie-blauw underline underline-offset-4">
          Wachtwoord vergeten?
        </Link>
      </div>
      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full">
        {bezig ? "Even wachten…" : "Inloggen"}
        {!bezig && <Icoon naam="pijl-rechts" />}
      </PrimaireKnop>
      <p className="border-t border-rand-zacht pt-5 text-center">
        Nog geen account?{" "}
        <Link href="/ouder/account-aanmaken" className="font-bold text-actie-blauw underline underline-offset-4">
          Maak een gratis account
        </Link>
      </p>
    </form>
  );
}
