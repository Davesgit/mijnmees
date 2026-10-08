import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Laden, TerugLink } from "@/components/mees/Bouwstenen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { haalEigenUitleg } from "@/features/tutorhulp/server";
import { vereisTutor } from "@/lib/server/rollen";
import { UitlegStudio } from "./UitlegStudio";

export const metadata: Metadata = { title: "Maak uitleg" };

type Props = PageProps<"/tutor/uitleg/[uitlegId]/bewerken">;

/** U04: bord + stem opnemen. */
export default function BewerkenPage({ params }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10">
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params }: Pick<Props, "params">) {
  const { uitlegId } = await params;
  const tutor = await vereisTutor(`/tutor/uitleg/${uitlegId}/bewerken`);
  const uitleg = await haalEigenUitleg(tutor, uitlegId);
  if (!uitleg) notFound();
  if (uitleg.status !== "concept") redirect(`/tutor/uitleg/${uitleg.id}/controle`);
  return (
    <>
      <TerugLink href={uitleg.hulpvraagId ? `/tutor/hulpvragen/${uitleg.hulpvraagId}` : "/tutor/uitlegbibliotheek"}>{uitleg.hulpvraagId ? "Hulpvraag" : "Uitlegbibliotheek"}</TerugLink>
      <div>
        <h1 className="titel-held">Maak uitleg</h1>
        <p className="mt-1 subtitel font-semibold text-tekst-zacht">Stem en tekenbord · {leerdoelNaam(uitleg.leerdoelId)}</p>
      </div>
      <UitlegStudio uitleg={{ id: uitleg.id, titel: uitleg.titel, bord: uitleg.bord, heeftOpname: Boolean(uitleg.audioPad), duurMs: uitleg.duurMs }} />
    </>
  );
}
