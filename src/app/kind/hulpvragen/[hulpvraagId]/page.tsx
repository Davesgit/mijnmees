import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { haalHulpvraagVanKind } from "@/features/tutorhulp/server";
import { haalActiefKind } from "@/lib/server/dal";

export const metadata: Metadata = { title: "Je hulpvraag" };

type Props = PageProps<"/kind/hulpvragen/[hulpvraagId]">;

/** H02: status van de hulpvraag. Geen harde antwoordtijd. */
export default function HulpvraagStatusPage({ params }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-[900px] tablet:py-10">
      <TerugLink href="/kind/start">Start</TerugLink>
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params }: Pick<Props, "params">) {
  const { hulpvraagId } = await params;
  const kind = await haalActiefKind();
  const hulpvraag = kind ? await haalHulpvraagVanKind(kind.id, hulpvraagId) : null;
  if (!hulpvraag) notFound();

  const metUitleg = hulpvraag.uitlegId && hulpvraag.status !== "in-behandeling" && hulpvraag.status !== "nieuw";
  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="titel-held">Je hulpvraag</h1>
          <p className="mt-2 subtitel font-semibold text-tekst-zacht">{leerdoelNaam(hulpvraag.leerdoelId)}</p>
        </div>
        <Mees pose={metUitleg ? "blij" : "helpt"} breedte={170} className="hidden w-32 tablet:block" />
      </div>
      {hulpvraag.status === "nieuw" && <Melding>Je hulpvraag is verstuurd. Een tutor pakt hem op.</Melding>}
      {hulpvraag.status === "in-behandeling" && <Melding>De tutor kijkt ernaar en maakt een uitleg voor je.</Melding>}
      {hulpvraag.status === "uitleg-verstuurd" && <Melding soort="succes">Je tutor heeft een uitleg voor je gemaakt.</Melding>}
      {hulpvraag.status === "afgerond" && <Melding soort="succes">Deze hulpvraag is klaar. Je kunt de uitleg altijd nog bekijken.</Melding>}
      {!metUitleg && <p className="text-lg">Je kunt ondertussen iets anders oefenen.</p>}
      <div className="flex flex-col gap-3 tablet:flex-row">
        {metUitleg && (
          <PrimaireKnop href={`/kind/uitleg/${hulpvraag.uitlegId}`} groot>
            Bekijk uitleg
            <Icoon naam="pijl-rechts" />
          </PrimaireKnop>
        )}
        <SecundaireKnop href="/kind/rekenen" groot={!metUitleg}>
          Kies iets anders
        </SecundaireKnop>
      </div>
    </>
  );
}
