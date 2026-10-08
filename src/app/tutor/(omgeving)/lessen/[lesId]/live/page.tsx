import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { formatLesDatum, formatLesTijd, kanStarten, lesConfig } from "@/features/live/regels";
import { haalTutorLes, liveGeconfigureerd } from "@/features/live/server";
import { vereisTutor } from "@/lib/server/rollen";
import { TutorLive } from "./TutorLive";

export const metadata: Metadata = { title: "Live les geven" };

type Props = PageProps<"/tutor/lessen/[lesId]/live">;

export default function TutorLivePage({ params }: Props) {
  return (
    <div className="mees-content flex flex-col gap-5 py-6 tablet:py-8">
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params }: Pick<Props, "params">) {
  const { lesId } = await params;
  const tutor = await vereisTutor(`/tutor/lessen/${lesId}/live`);
  const les = await haalTutorLes(tutor, lesId);
  if (!les) notFound();
  const kop = (
    <>
      <TerugLink href="/tutor/lessen">Mijn lessen</TerugLink>
      <div>
        <h1 className="titel-pagina">{les.titel}</h1>
        <p className="mt-1 font-semibold text-tekst-zacht">
          {leerdoelNaam(les.leerdoelId)} · {formatLesDatum(les.startOp)} om {formatLesTijd(les.startOp)} · {les.duurMin} minuten
        </p>
      </div>
    </>
  );
  if (!liveGeconfigureerd()) return <>{kop}<Melding soort="fout">Live-geluid is nog niet aangesloten. De les kan nu niet starten.</Melding></>;
  if (les.status === "afgelopen" || les.status === "geannuleerd") return <>{kop}<Melding>Deze les is {les.status === "afgelopen" ? "afgelopen" : "geannuleerd"}.</Melding></>;
  return (
    <>
      {kop}
      {les.status === "gepland" && !kanStarten(les.startOp, les.duurMin) && (
        <Melding>Je kunt de les starten vanaf {lesConfig.startVensterMin} minuten voor de begintijd. Je kunt het bord wel alvast bekijken.</Melding>
      )}
      <TutorLive les={{ id: les.id, titel: les.titel, opnemen: les.opnemen, status: les.status, vragenGepauzeerd: les.vragenGepauzeerd }} />
    </>
  );
}
