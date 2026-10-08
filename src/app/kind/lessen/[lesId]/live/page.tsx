import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { leerdoelNaam, leerdoelOefenRoute } from "@/features/oefenen/weergave";
import { lesVoorKind, liveGeconfigureerd } from "@/features/live/server";
import { haalActiefKind } from "@/lib/server/dal";
import { KindLive } from "./KindLive";

export const metadata: Metadata = { title: "Live uitleg" };

type Props = PageProps<"/kind/lessen/[lesId]/live">;

export default function KindLivePage({ params }: Props) {
  return (
    <div className="mees-content flex flex-col gap-5 py-4 tablet:max-w-[1200px] tablet:py-6">
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
  if (!les || les.uitnodiging.status !== "toegestaan") notFound();
  return (
    <>
      <TerugLink href={`/kind/lessen/${les.id}`}>De les</TerugLink>
      <div>
        <h1 className="titel-pagina">Live uitleg</h1>
        <p className="mt-1 font-semibold text-tekst-zacht">{leerdoelNaam(les.leerdoelId)}</p>
      </div>
      {!liveGeconfigureerd() ? (
        <Melding>Live-geluid is nu niet beschikbaar.</Melding>
      ) : les.uitnodiging.kindAanmelding !== "ja" ? (
        <Melding>Meld je eerst aan voor deze les.</Melding>
      ) : (
        <KindLive les={{ id: les.id, titel: les.titel, tutorVoornaam: les.tutorVoornaam, oefenRoute: leerdoelOefenRoute(les.leerdoelId) }} />
      )}
    </>
  );
}
