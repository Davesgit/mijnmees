import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam, leerdoelOefenRoute } from "@/features/oefenen/weergave";
import { lesVoorKind } from "@/features/live/server";
import { lesOpname } from "@/features/tutorhulp/server";
import { UitlegSpeler } from "@/features/tutorhulp/UitlegSpeler";
import { haalActiefKind } from "@/lib/server/dal";

export const metadata: Metadata = { title: "Les terugkijken" };

type Props = PageProps<"/kind/lessen/[lesId]/terugkijken">;

/** L06: alleen gecontroleerde opnames (tutorstem + bord), alleen voor uitgenodigde kinderen met toestemming. */
export default function TerugkijkenPage({ params }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-[1000px] tablet:py-10">
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params }: Pick<Props, "params">) {
  const { lesId } = await params;
  const kind = await haalActiefKind();
  const les = kind ? await lesVoorKind(kind.id, lesId) : null;
  if (!les || les.uitnodiging.status !== "toegestaan" || !les.opnameGepubliceerd || !les.opnameUitlegId) notFound();
  const opname = await lesOpname(les.opnameUitlegId);
  if (!opname) notFound();
  return (
    <>
      <TerugLink href={`/kind/lessen/${les.id}`}>De les</TerugLink>
      <div>
        <h1 className="titel-held">{les.titel}</h1>
        <p className="mt-2 subtitel font-semibold text-tekst-zacht">
          {leerdoelNaam(les.leerdoelId)} · van tutor {les.tutorVoornaam}
        </p>
      </div>
      <UitlegSpeler titel={opname.titel} bord={opname.bord} duurMs={opname.duurMs} audioUrl={opname.audioUrl} transcript={opname.transcript} />
      <PrimaireKnop href={leerdoelOefenRoute(les.leerdoelId)} groot className="self-start">
        Probeer het zelf
        <Icoon naam="pijl-rechts" />
      </PrimaireKnop>
    </>
  );
}
