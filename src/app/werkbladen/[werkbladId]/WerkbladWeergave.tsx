"use client";

import Link from "next/link";
import { useState } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { WerkbladBlad } from "@/features/werkbladen/WerkbladBlad";
import { aanpasLink, useWerkblad } from "@/features/werkbladen/useWerkblad";

/** W02: het gemaakte werkblad met printen, PDF, antwoordblad en aanpassen. */
export function WerkbladWeergave({ id }: { id: string }) {
  const staat = useWerkblad(id);
  const [pdfUitleg, setPdfUitleg] = useState(false);

  if (staat.status === "laden") return <Laden />;
  if (staat.status === "niet-gevonden") {
    return (
      <div className="mees-content flex flex-col gap-4 py-10">
        <h1 className="titel-pagina">Dit werkblad is niet gevonden</h1>
        <p>Het werkblad staat niet op dit apparaat en niet bij je account. Maak gerust een nieuw werkblad.</p>
        <PrimaireKnop href="/werkbladen/samenstellen" className="self-start">
          Maak een werkblad
        </PrimaireKnop>
      </div>
    );
  }

  const { werkblad, opServer } = staat;
  const printLink = `/werkbladen/${werkblad.id}/print`;

  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10">
      <div className="print:hidden">
        <TerugLink href="/werkbladen/samenstellen">Nieuw werkblad</TerugLink>
        <h1 className="mt-2 titel-pagina">Je werkblad is klaar</h1>
        <p className="mt-1 text-tekst-zacht">
          {werkblad.titel} · {werkblad.vragen.length} vragen · code {werkblad.code}
        </p>
      </div>

      {/* Acties boven het blad: op de telefoon onder elkaar, op groter scherm naast elkaar. */}
      <div className="grid gap-3 print:hidden tablet:grid-cols-2 desktop:grid-cols-4">
        <PrimaireKnop href={printLink}>
          <Icoon naam="printer" />
          Print werkblad
        </PrimaireKnop>
        <SecundaireKnop onClick={() => setPdfUitleg((o) => !o)} aria-expanded={pdfUitleg}>
          <Icoon naam="download" />
          Download als PDF
        </SecundaireKnop>
        {opServer ? (
          <SecundaireKnop href={`/ouder/werkbladen/${werkblad.id}/antwoorden`}>
            <Icoon naam="slot" />
            Antwoordblad
          </SecundaireKnop>
        ) : (
          <SecundaireKnop href="/voortgang-bewaren">
            <Icoon naam="slot" />
            Antwoordblad
          </SecundaireKnop>
        )}
        <SecundaireKnop href={aanpasLink(werkblad)}>Pas aan</SecundaireKnop>
      </div>

      {pdfUitleg && (
        <Melding className="print:hidden">
          <p>
            Open de <Link href={printLink} className="font-semibold text-actie-blauw underline">printversie</Link> en kies bij printer <strong>Opslaan als PDF</strong>. Zo krijg je een PDF op je eigen apparaat.
          </p>
        </Melding>
      )}
      {!opServer && (
        <p className="tekst-klein text-tekst-zacht print:hidden">
          Het antwoordblad is voor ouders. Met een ouderaccount wordt het werkblad bewaard en kun je het antwoordblad openen en papierwerk bijhouden.
        </p>
      )}

      <WerkbladBlad werkblad={werkblad} />
    </div>
  );
}
