import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, TerugLink } from "@/components/mees/Bouwstenen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { uitlegVoorKind } from "@/features/tutorhulp/server";
import { UitlegSpeler } from "@/features/tutorhulp/UitlegSpeler";
import { haalActiefKind } from "@/lib/server/dal";
import { ProbeerZelf } from "./ProbeerZelf";

export const metadata: Metadata = { title: "Uitleg voor jou" };

type Props = PageProps<"/kind/uitleg/[uitlegId]">;

/** H03: tutorstem + bord, daarna een nieuwe controlevraag. Bekijken is geen bewijs van beheersing. */
export default function UitlegPage({ params }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-[1000px] tablet:py-10">
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params }: Pick<Props, "params">) {
  const { uitlegId } = await params;
  const kind = await haalActiefKind();
  const gegevens = kind ? await uitlegVoorKind(kind.id, uitlegId) : null;
  if (!gegevens) notFound();
  const { uitleg, hulpvraag } = gegevens;
  return (
    <>
      <TerugLink href={`/kind/hulpvragen/${hulpvraag.id}`}>Je hulpvraag</TerugLink>
      <div>
        <h1 className="titel-held">Uitleg voor jou</h1>
        <p className="mt-2 subtitel font-semibold text-tekst-zacht">
          {leerdoelNaam(uitleg.leerdoelId)} · van tutor {uitleg.tutorVoornaam}
        </p>
      </div>
      <UitlegSpeler titel={uitleg.titel} bord={uitleg.bord} duurMs={uitleg.duurMs} audioUrl={uitleg.audioUrl} transcript={uitleg.transcript} />
      {hulpvraag.controleVraagId && <ProbeerZelf hulpvraagId={hulpvraag.id} vraagId={hulpvraag.controleVraagId} />}
    </>
  );
}
