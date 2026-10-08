"use client";

import { useActionState, useState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { InvoerVeld, Schakelaar, type FormStatus } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { AvatarKiezer, GroepKiezer } from "@/components/mees/KindVelden";
import { Avatar } from "@/components/mees/Profiel";
import type { Kind } from "@/lib/kinderen";
import { emailvoorkeurenBewaren, kindBijwerken } from "../../kind-acties";

export function KindInstellingen({ kind, tutorhulp: tutorhulpStart }: { kind: Kind; tutorhulp: boolean }) {
  const [open, setOpen] = useState(false);
  const [tutorhulp, setTutorhulp] = useState(tutorhulpStart);
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(kindBijwerken, {});
  return (
    <div className="rounded-[16px] border border-rand-zacht">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-16 w-full items-center gap-4 rounded-[16px] p-4 text-left hover:bg-achtergrond-zacht"
      >
        <Avatar id={kind.avatar} className="size-14" />
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">{kind.voornaam}</span>
          <span className="block tekst-klein text-tekst-zacht">
            Groep {kind.groep} · Tutorhulp {tutorhulpStart ? "toegestaan" : "niet toegestaan"}
          </span>
        </span>
        <Icoon naam="chevron-omlaag" className={`size-6 text-actie-blauw transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <form action={actie} className="flex flex-col gap-6 border-t border-rand-zacht p-4 tablet:p-6" noValidate>
          <input type="hidden" name="kindId" value={kind.id} />
          {status.melding && <Melding soort={status.gelukt ? "succes" : "fout"}>{status.melding}</Melding>}
          <InvoerVeld label="Voornaam" name="voornaam" maxLength={30} defaultValue={kind.voornaam} required fout={status.fouten?.voornaam} />
          <GroepKiezer standaard={kind.groep} fout={status.fouten?.groep} />
          <AvatarKiezer standaard={kind.avatar} fout={status.fouten?.avatar} />
          <div className="rounded-[12px] bg-blauw-zacht p-4">
            <Schakelaar
              naam="tutorhulp"
              aan={tutorhulp}
              onWijzig={setTutorhulp}
              label="Tutorhulp toestaan"
              uitleg={`Als het oefenen niet lukt, kan Mees voorstellen dat een tutor ${kind.voornaam} helpt. Jij ziet elke aanvraag en beslist zelf of die naar een tutor gaat. Een tutor ziet alleen de voornaam, de groep en de oefeningen.`}
            />
          </div>
          <PrimaireKnop type="submit" disabled={bezig} className="self-start">
            {bezig ? "Even wachten…" : "Bewaar profiel"}
          </PrimaireKnop>
        </form>
      )}
    </div>
  );
}

export function EmailVoorkeuren({ uitleg: uitlegStart, lessen: lessenStart }: { uitleg: boolean; lessen: boolean }) {
  const [uitleg, setUitleg] = useState(uitlegStart);
  const [lessen, setLessen] = useState(lessenStart);
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(emailvoorkeurenBewaren, {});
  return (
    <form action={actie} aria-labelledby="email-titel" className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
      <h2 id="email-titel" className="subtitel">E-mailmeldingen</h2>
      <p className="mt-1 tekst-klein text-tekst-zacht">Korte mails, zonder opgaven of antwoorden van je kind.</p>
      <div className="mt-4 flex flex-col divide-y divide-rand-zacht">
        <div className="py-3">
          <Schakelaar naam="email_uitleg" aan={uitleg} onWijzig={setUitleg} label="Nieuwe uitleg beschikbaar" uitleg="Als er uitleg van een tutor klaarstaat." />
        </div>
        <div className="py-3">
          <Schakelaar naam="email_lessen" aan={lessen} onWijzig={setLessen} label="Uitnodiging voor een les" uitleg="Als je kind wordt uitgenodigd voor een live-les." />
        </div>
      </div>
      {status.melding && (
        <p role="status" className={`mt-2 font-semibold ${status.gelukt ? "text-succes" : "text-fout"}`}>
          {status.melding}
        </p>
      )}
      <PrimaireKnop type="submit" disabled={bezig} className="mt-4">
        {bezig ? "Even wachten…" : "Bewaar instellingen"}
      </PrimaireKnop>
    </form>
  );
}
