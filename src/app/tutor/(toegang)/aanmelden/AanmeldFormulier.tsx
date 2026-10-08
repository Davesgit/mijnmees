"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { InvoerVeld, Vinkje, type FormStatus } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { meldAanAlsTutor, registreerTutor } from "@/app/tutor/acties";
import { tutorAfspraken } from "@/features/tutorhulp/afspraken";

function Tekstvak({ naam, label, hulp, fout, waarde }: { naam: string; label: string; hulp: string; fout?: string; waarde?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <p id={`${id}-hulp`} className="tekst-klein text-tekst-zacht">
        {hulp}
      </p>
      <textarea
        id={id}
        name={naam}
        rows={4}
        maxLength={1500}
        defaultValue={waarde}
        aria-invalid={fout ? true : undefined}
        aria-describedby={`${id}-hulp${fout ? ` ${id}-fout` : ""}`}
        className={`rounded-[12px] border bg-wit px-4 py-3 text-lg ${fout ? "border-2 border-fout" : "border-rand-interactief"}`}
      />
      {fout && (
        <p id={`${id}-fout`} className="flex items-start gap-2 tekst-klein font-semibold text-fout">
          <Icoon naam="fout" className="mt-0.5 size-5" />
          {fout}
        </p>
      )}
    </div>
  );
}

export function AanmeldFormulier({ ingelogdAls }: { ingelogdAls: string | null }) {
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(ingelogdAls ? meldAanAlsTutor : registreerTutor, {});
  const f = status.fouten ?? {};
  const w = status.waarden ?? {};
  return (
    <form action={actie} className="flex flex-col gap-5" noValidate>
      {status.melding && <Melding soort="fout">{status.melding}</Melding>}
      {ingelogdAls && <Melding>Je meldt je aan met je Mees-account ({ingelogdAls}).</Melding>}
      <div className="grid gap-5 tablet:grid-cols-2">
        <InvoerVeld label="Voornaam" name="voornaam" autoComplete="given-name" fout={f.voornaam} defaultValue={w.voornaam} required />
        <InvoerVeld label="Achternaam" name="achternaam" autoComplete="family-name" fout={f.achternaam} defaultValue={w.achternaam} required />
      </div>
      <p className="-mt-2 tekst-klein text-tekst-zacht">Kinderen zien alleen je voornaam.</p>
      {!ingelogdAls && (
        <>
          <InvoerVeld label="E-mailadres" name="email" type="email" autoComplete="email" fout={f.email} defaultValue={w.email} required />
          <InvoerVeld label="Wachtwoord" name="wachtwoord" type="password" autoComplete="new-password" fout={f.wachtwoord} hulp="Minstens 10 tekens, met een letter en een cijfer." required />
          <InvoerVeld label="Herhaal wachtwoord" name="herhaal" type="password" autoComplete="new-password" fout={f.herhaal} required />
        </>
      )}
      <Tekstvak naam="ervaring" label="Je ervaring" hulp="Bijvoorbeeld: leerkracht, student pabo, bijles gegeven." fout={f.ervaring} waarde={w.ervaring} />
      <Tekstvak naam="motivatie" label="Waarom wil je helpen?" hulp="Een paar zinnen is genoeg." fout={f.motivatie} waarde={w.motivatie} />

      <section className="rounded-[16px] border border-rand-zacht bg-achtergrond-zacht p-4">
        <h2 className="font-bold">Afspraken voor tutors</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 tekst-klein">
          {tutorAfspraken.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>
      <Vinkje naam="afspraken" fout={f.afspraken}>
        Ik ga akkoord met de afspraken voor tutors.
      </Vinkje>

      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full">
        {bezig ? "Even wachten…" : "Meld je aan"}
        {!bezig && <Icoon naam="pijl-rechts" />}
      </PrimaireKnop>
      <p className="tekst-klein text-tekst-zacht">Na je aanmelding bekijkt Mees je gegevens. Pas daarna kun je hulpvragen zien.</p>
      {!ingelogdAls && (
        <p className="border-t border-rand-zacht pt-5 text-center">
          Al een account?{" "}
          <Link href="/tutor/inloggen?terug=/tutor/aanmelden" className="font-bold text-actie-blauw underline underline-offset-4">
            Log in
          </Link>
        </p>
      )}
    </form>
  );
}
