"use client";

import { useActionState, useState } from "react";
import { Dialoog } from "@/components/mees/Dialoog";
import { InvoerVeld, type FormStatus } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { GevaarKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Avatar } from "@/components/mees/Profiel";
import type { Kind } from "@/lib/kinderen";
import { wisKindprofielenOpApparaat } from "@/lib/opslag/lokaal";
import { accountVerwijderen, kindVerwijderen } from "../../kind-acties";

export function KindVerwijderen({ kind }: { kind: Kind }) {
  const [open, setOpen] = useState(false);
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(kindVerwijderen, {});
  if (status.gelukt) return <p className="font-semibold text-succes">{status.melding}</p>;
  return (
    <div className="flex items-center gap-3">
      <Avatar id={kind.avatar} />
      <span className="flex-1 font-bold">{kind.voornaam}</span>
      <SecundaireKnop onClick={() => setOpen(true)}>
        <Icoon naam="prullenbak" />
        Verwijder
      </SecundaireKnop>
      <Dialoog open={open} onSluit={() => setOpen(false)} titel={`Profiel van ${kind.voornaam} verwijderen?`}>
        <form action={actie} className="flex flex-col gap-4">
          <input type="hidden" name="kindId" value={kind.id} />
          <p>Alle oefeningen, voortgang en weetjes van {kind.voornaam} worden verwijderd. Dit kun je niet terugdraaien.</p>
          {status.melding && <p className="font-semibold text-fout">{status.melding}</p>}
          <InvoerVeld label={`Typ ${kind.voornaam} om te bevestigen`} name="bevestiging" autoComplete="off" fout={status.fouten?.bevestiging} />
          <div className="flex flex-wrap gap-3">
            <GevaarKnop type="submit" disabled={bezig}>
              {bezig ? "Even wachten…" : "Verwijder profiel"}
            </GevaarKnop>
            <SecundaireKnop onClick={() => setOpen(false)}>Annuleren</SecundaireKnop>
          </div>
        </form>
      </Dialoog>
    </div>
  );
}

export function AccountVerwijderen() {
  const [open, setOpen] = useState(false);
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(accountVerwijderen, {});
  return (
    <>
      <SecundaireKnop onClick={() => setOpen(true)} className="mt-4 border-fout text-fout">
        <Icoon naam="prullenbak" />
        Verwijder mijn account
      </SecundaireKnop>
      <Dialoog open={open} onSluit={() => setOpen(false)} titel="Account verwijderen?">
        <form action={actie} onSubmit={() => wisKindprofielenOpApparaat()} className="flex flex-col gap-4">
          <p>Je account, alle kinderprofielen en alle voortgang worden verwijderd. Dit kun je niet terugdraaien.</p>
          {status.melding && <p className="font-semibold text-fout">{status.melding}</p>}
          <InvoerVeld label="Typ VERWIJDER om te bevestigen" name="bevestiging" autoComplete="off" fout={status.fouten?.bevestiging} />
          <div className="flex flex-wrap gap-3">
            <GevaarKnop type="submit" disabled={bezig}>
              {bezig ? "Even wachten…" : "Verwijder account"}
            </GevaarKnop>
            <SecundaireKnop onClick={() => setOpen(false)}>Annuleren</SecundaireKnop>
          </div>
        </form>
      </Dialoog>
    </>
  );
}
