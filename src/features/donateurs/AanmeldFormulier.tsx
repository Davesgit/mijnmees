"use client";

import { useActionState, useEffect, useRef } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { InvoerVeld, Vinkje, type FormStatus } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { meldAanAlsDonateur } from "@/app/(publiek)/donateurs/acties";

export function AanmeldFormulier() {
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(meldAanAlsDonateur, {});
  const f = status.fouten ?? {};
  const w = status.waarden ?? {};
  const meldingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status.gelukt || status.melding) meldingRef.current?.focus();
  }, [status]);

  return (
    <section id="aanmelden" aria-labelledby="aanmelden-kop" className="scroll-mt-24 rounded-[20px] bg-blauw-zacht p-5 tablet:p-8">
      <h2 id="aanmelden-kop" className="titel-pagina">
        Wil je Mees langer steunen?
      </h2>
      <p className="mt-1 text-tekst-zacht">Laat je gegevens achter. We nemen contact op.</p>
      {status.gelukt ? (
        <div ref={meldingRef} tabIndex={-1} className="mt-5">
          <Melding soort="succes">{status.melding}</Melding>
        </div>
      ) : (
        <form action={actie} className="mt-5 flex flex-col gap-4" noValidate>
          <div ref={meldingRef} tabIndex={-1}>
            {status.melding && <Melding soort="fout">{status.melding}</Melding>}
          </div>
          {/* Onzichtbaar voor mensen; alleen robots vullen dit in. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="grid gap-4 tablet:grid-cols-2">
            <InvoerVeld label="Naam" name="naam" autoComplete="name" maxLength={100} defaultValue={w.naam} fout={f.naam} required />
            <InvoerVeld label="E-mailadres" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={w.email} fout={f.email} required />
            <InvoerVeld label="Bedrijf of organisatie (optioneel)" name="organisatie" autoComplete="organization" maxLength={150} defaultValue={w.organisatie} fout={f.organisatie} />
            <label className="flex flex-col gap-2 font-bold">
              Gewenste looptijd
              <select name="looptijd" defaultValue={w.looptijd || "bespreken"} className="min-h-12 rounded-[12px] border border-rand-interactief bg-wit px-3 text-lg font-normal">
                <option value="bespreken">Bespreek ik graag</option>
                <option value="1-jaar">1 jaar</option>
                <option value="2-jaar">2 jaar</option>
                <option value="3-jaar">3 jaar</option>
                <option value="5-jaar-of-langer">5 jaar of langer</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 font-bold">
            Toelichting (optioneel)
            <textarea name="toelichting" rows={3} maxLength={1000} defaultValue={w.toelichting} className="rounded-[12px] border border-rand-interactief bg-wit px-4 py-3 text-lg font-normal" />
            {f.toelichting && <span className="tekst-klein text-fout">{f.toelichting}</span>}
          </label>
          <Vinkje naam="toestemming" fout={f.toestemming}>
            Mees mag mij over deze aanmelding benaderen.
          </Vinkje>
          <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
            <PrimaireKnop type="submit" disabled={bezig} className="w-full tablet:w-auto">
              {bezig ? "Even versturen…" : "Verstuur mijn aanmelding"}
              {!bezig && <Icoon naam="pijl-rechts" />}
            </PrimaireKnop>
            <p className="tekst-klein text-tekst-zacht">Vrijblijvend. Je doet hiermee nog geen betaling.</p>
          </div>
        </form>
      )}
    </section>
  );
}
