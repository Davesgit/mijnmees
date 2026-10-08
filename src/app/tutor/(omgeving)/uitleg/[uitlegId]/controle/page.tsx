import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { SecundaireKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { haalEigenUitleg, uitlegVoorTutor } from "@/features/tutorhulp/server";
import { UitlegSpeler } from "@/features/tutorhulp/UitlegSpeler";
import { vereisTutor } from "@/lib/server/rollen";
import { nieuweVersie } from "../../../../acties";
import { PubliceerFormulier } from "./PubliceerFormulier";

export const metadata: Metadata = { title: "Controleer de uitleg" };

type Props = PageProps<"/tutor/uitleg/[uitlegId]/controle">;

/** U05: bekijk en luister vóór je verstuurt. */
export default function ControlePage({ params, searchParams }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10">
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const [{ uitlegId }, { les }] = await Promise.all([params, searchParams]);
  const tutor = await vereisTutor(`/tutor/uitleg/${uitlegId}/controle`);
  const [uitleg, speler] = await Promise.all([haalEigenUitleg(tutor, uitlegId), uitlegVoorTutor(tutor, uitlegId)]);
  if (!uitleg || !speler) notFound();
  const gepubliceerd = uitleg.status === "gepubliceerd";
  return (
    <>
      <TerugLink href={uitleg.hulpvraagId ? `/tutor/hulpvragen/${uitleg.hulpvraagId}` : "/tutor/uitlegbibliotheek"}>{uitleg.hulpvraagId ? "Hulpvraag" : "Uitlegbibliotheek"}</TerugLink>
      <div>
        <h1 className="titel-held">{gepubliceerd ? "Je uitleg" : "Controleer de uitleg"}</h1>
        <p className="mt-1 subtitel font-semibold text-tekst-zacht">
          {uitleg.titel} · {leerdoelNaam(uitleg.leerdoelId)}
        </p>
      </div>
      {les && !gepubliceerd && (
        <Melding>Controleer de lesopname: geen kindnamen, privévragen of contactgegevens. Pas na publicatie kunnen uitgenodigde kinderen de les terugkijken.</Melding>
      )}
      {!uitleg.audioPad ? (
        <Melding soort="probeer-opnieuw">Er is nog geen opname. Neem eerst je uitleg op.</Melding>
      ) : (
        <div className="max-w-4xl">
          <UitlegSpeler titel={speler.titel} bord={speler.bord} duurMs={speler.duurMs} audioUrl={speler.audioUrl} transcript={gepubliceerd ? speler.transcript : ""} />
        </div>
      )}
      {gepubliceerd ? (
        <div className="flex flex-col gap-3">
          <Melding soort="succes">Deze uitleg is gepubliceerd. Aanpassen maakt een nieuwe versie; kinderen blijven deze versie zien.</Melding>
          <form action={nieuweVersie}>
            <input type="hidden" name="uitlegId" value={uitleg.id} />
            <SecundaireKnop type="submit">Maak een nieuwe versie</SecundaireKnop>
          </form>
        </div>
      ) : (
        <PubliceerFormulier uitlegId={uitleg.id} transcript={uitleg.transcript} heeftOpname={Boolean(uitleg.audioPad)} naarKind={Boolean(uitleg.hulpvraagId)} />
      )}
    </>
  );
}
