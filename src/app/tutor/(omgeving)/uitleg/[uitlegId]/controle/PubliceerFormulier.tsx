"use client";

import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { Vinkje, type FormStatus } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { publiceerUitleg } from "@/app/tutor/acties";

export function PubliceerFormulier({ uitlegId, transcript, heeftOpname, naarKind }: { uitlegId: string; transcript: string; heeftOpname: boolean; naarKind: boolean }) {
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(publiceerUitleg, {});
  const f = status.fouten ?? {};
  return (
    <form action={actie} className="flex max-w-3xl flex-col gap-5">
      <input type="hidden" name="uitlegId" value={uitlegId} />
      <div className="flex flex-col gap-2">
        <label htmlFor="transcript" className="font-bold">
          Transcript
        </label>
        <p id="transcript-hulp" className="tekst-klein text-tekst-zacht">
          Schrijf op wat je zegt. Kinderen kunnen dan meelezen, ook als het geluid niet werkt. Er is (nog) geen automatische spraak-naar-tekst.
        </p>
        <textarea
          id="transcript"
          name="transcript"
          rows={8}
          maxLength={10000}
          defaultValue={status.waarden?.transcript ?? transcript}
          aria-invalid={f.transcript ? true : undefined}
          aria-describedby={`transcript-hulp${f.transcript ? " transcript-fout" : ""}`}
          className={`rounded-[12px] border bg-wit px-4 py-3 text-lg ${f.transcript ? "border-2 border-fout" : "border-rand-interactief"}`}
        />
        {f.transcript && (
          <p id="transcript-fout" className="flex items-start gap-2 tekst-klein font-semibold text-fout">
            <Icoon naam="fout" className="mt-0.5 size-5" />
            {f.transcript}
          </p>
        )}
      </div>
      <section className="rounded-[16px] border border-rand-zacht bg-wit p-4">
        <h2 className="font-bold">Controleer voor je verstuurt</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
          <li>Klopt de som, en klopt de uitleg?</li>
          <li>Klopt het transcript met wat je zegt?</li>
          <li>Er staan geen namen of privégegevens in de uitleg, de titel of de opname.</li>
        </ul>
      </section>
      <Vinkje naam="privacy" fout={f.privacy}>
        Ik heb de uitleg bekeken en beluisterd. Er staan geen namen of privégegevens in.
      </Vinkje>
      {status.melding && <Melding soort={status.gelukt ? "succes" : "fout"}>{status.melding}</Melding>}
      <div className="flex flex-col gap-3 tablet:flex-row">
        <PrimaireKnop type="submit" name="actie" value="publiceer" disabled={bezig || !heeftOpname}>
          {naarKind ? "Stuur uitleg" : "Publiceer in de bibliotheek"}
          <Icoon naam="pijl-rechts" />
        </PrimaireKnop>
        <SecundaireKnop href={`/tutor/uitleg/${uitlegId}/bewerken`}>Pas aan</SecundaireKnop>
        <SecundaireKnop type="submit" name="actie" value="concept" disabled={bezig}>
          Bewaar concept
        </SecundaireKnop>
      </div>
    </form>
  );
}
