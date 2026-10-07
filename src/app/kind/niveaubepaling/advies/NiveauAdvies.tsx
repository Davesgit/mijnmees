"use client";

import { useSearchParams } from "next/navigation";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { niveauAdvies, niveauGebieden, tafelsPerNiveau } from "@/features/oefenen/sessie";
import { useOpslag } from "@/lib/opslag/lokaal";

const niveauNaam = { makkelijk: "Makkelijk", "past-bij-mij": "Past bij mij", uitdagend: "Uitdagend" } as const;

/** N03: voorzichtig beginadvies met één concreet onderdeel; geen cijfer of klassering. */
export function NiveauAdvies() {
  const opslag = useOpslag();
  const sessieId = useSearchParams().get("sessie");
  if (opslag === null) return <Laden />;

  const sessie = sessieId ? opslag.sessies[sessieId] : undefined;
  if (!sessie || sessie.soort !== "niveau") {
    return (
      <div className="mees-content py-10">
        <h1 className="titel-pagina">Een passend begin</h1>
        <Melding className="mt-6">Er is nog te weinig informatie voor een voorstel.</Melding>
        <PrimaireKnop href="/kind/niveaubepaling" className="mt-4">
          Wat past bij jou?
        </PrimaireKnop>
      </div>
    );
  }

  const advies = niveauAdvies(sessie);
  const gebied = niveauGebieden[advies.gebied];
  const route =
    advies.gebied === "tafels"
      ? `/kind/tafeltrainer?tafels=${tafelsPerNiveau[advies.niveau].join(",")}`
      : `/kind/oefening/instellen?onderdeel=${gebied.onderdeelId}&niveau=${advies.niveau}`;
  const voorstel =
    advies.gebied === "tafels"
      ? { titel: `Tafels van ${tafelsPerNiveau[advies.niveau].join(", ")}`, tekst: "Begin met deze tafels." }
      : { titel: `${gebied.onderdeelNaam} · ${niveauNaam[advies.niveau]}`, tekst: advies.niveau === "makkelijk" ? "Eerst de basis." : "Hier kun je goed mee verder." };

  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-[1000px] tablet:py-10">
      <TerugLink href="/kind/niveaubepaling">Wat past bij jou?</TerugLink>
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="titel-held">Een passend begin</h1>
          <p className="mt-2 subtitel font-semibold text-tekst-zacht">Dit is een eerste voorstel. Mees leert tijdens het oefenen wat bij je past.</p>
        </div>
        <Mees pose="blij" breedte={180} className="hidden w-40 tablet:block" />
      </div>

      {!advies.zeker && (
        <Melding>Er is nog weinig informatie. Begin rustig; Mees past de vragen aan terwijl je oefent.</Melding>
      )}

      <section aria-labelledby="voorstel-titel">
        <h2 id="voorstel-titel" className="mb-3 subtitel">
          Ons voorstel voor nu
        </h2>
        <div className="flex flex-col gap-4 rounded-[16px] border border-rand-zacht bg-blauw-zacht p-5 tablet:flex-row tablet:items-center tablet:p-6">
          <span className="grid size-16 shrink-0 place-items-center rounded-[14px] bg-wit text-actie-blauw" aria-hidden>
            <Icoon naam={advies.gebied === "tafels" ? "tafels" : "breuken"} className="size-8" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-bold">{voorstel.titel}</span>
            <span className="block text-tekst-zacht">{voorstel.tekst}</span>
          </span>
          <PrimaireKnop href={route} className="w-full tablet:w-auto">
            Probeer dit
            <Icoon naam="pijl-rechts" />
          </PrimaireKnop>
        </div>
        <p className="mt-3 tekst-klein text-tekst-zacht">
          Dit is een beginadvies, geen toetscijfer. {advies.zelfstandig} van de {advies.gemaakt} vragen lukten zonder hulp.
        </p>
      </section>

      <div className="flex flex-col gap-3 border-t border-rand-zacht pt-6 tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <p className="font-bold">Toch iets anders kiezen?</p>
          <p className="text-tekst-zacht">Bekijk alle oefeningen en kies zelf.</p>
        </div>
        <SecundaireKnop href="/kind/rekenen">Kies zelf</SecundaireKnop>
      </div>
    </div>
  );
}
