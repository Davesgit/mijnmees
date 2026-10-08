import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { haalLesvoorstel } from "@/features/live/server";
import { vereisTutor } from "@/lib/server/rollen";
import { PlanFormulier } from "./PlanFormulier";

export const metadata: Metadata = { title: "Plan een live les" };

type Props = PageProps<"/tutor/lessen/inplannen">;

/** L01: plannen vanuit een lesvoorstel. Uitnodigingen gaan alleen naar passende kinderen en hun ouders. */
export default function InplannenPage({ searchParams }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-[900px] tablet:py-10">
      <TerugLink href="/tutor">Dashboard</TerugLink>
      <div>
        <h1 className="titel-held">Plan een live les</h1>
        <p className="mt-1 subtitel font-semibold text-tekst-zacht">Geef samen uitleg over één onderdeel.</p>
      </div>
      <Suspense fallback={<Laden />}>
        <Inhoud searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ searchParams }: Pick<Props, "searchParams">) {
  await vereisTutor("/tutor/lessen/inplannen");
  const { leerdoel } = await searchParams;
  const leerdoelId = typeof leerdoel === "string" ? leerdoel : "";
  const voorstel = leerdoelId ? await haalLesvoorstel(leerdoelId) : null;
  if (!voorstel) return <Melding>Een live les plan je vanuit een lesvoorstel op je dashboard. Voor dit onderdeel is er nu geen voorstel.</Melding>;
  return <PlanFormulier leerdoelId={leerdoelId} leerdoel={leerdoelNaam(leerdoelId)} aantal={voorstel.aantal} />;
}
