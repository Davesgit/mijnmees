import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { lesConfig } from "@/features/live/regels";
import { haalLesvoorstel } from "@/features/live/server";
import { vereisTutor } from "@/lib/server/rollen";
import { geenLesNodig } from "../../../les-acties";

export const metadata: Metadata = { title: "Lesvoorstel" };

type Props = PageProps<"/tutor/lesvoorstellen/[doelId]">;

/** U09: feitelijke aantallen, geen namen. De tutor beslist; er komt nooit automatisch een les. */
export default function LesvoorstelPage({ params }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-[900px] tablet:py-10">
      <TerugLink href="/tutor">Dashboard</TerugLink>
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params }: Pick<Props, "params">) {
  await vereisTutor("/tutor");
  const leerdoelId = decodeURIComponent((await params).doelId);
  const voorstel = await haalLesvoorstel(leerdoelId);
  return (
    <>
      <div>
        <h1 className="titel-held">Samen uitleg kan helpen</h1>
        <p className="mt-1 subtitel font-semibold text-tekst-zacht">{leerdoelNaam(leerdoelId)}</p>
      </div>
      {!voorstel ? (
        <Melding>Er zijn nog niet genoeg passende kinderen voor een les over dit onderdeel.</Melding>
      ) : (
        <>
          <ul className="grid gap-3 min-[480px]:grid-cols-2">
            <li className="rounded-[16px] border border-rand-zacht bg-wit p-5">
              <span className="block text-4xl font-extrabold text-actie-blauw">{voorstel.aantal}</span>
              <span className="font-bold">verschillende kinderen</span>
              <span className="block tekst-klein text-tekst-zacht">hadden de uitleg van Mees nodig</span>
            </li>
            <li className="rounded-[16px] border border-rand-zacht bg-wit p-5">
              <span className="block text-4xl font-extrabold text-actie-blauw">{lesConfig.signaalDagen}</span>
              <span className="font-bold">dagen</span>
              <span className="block tekst-klein text-tekst-zacht">periode van dit voorstel</span>
            </li>
          </ul>
          <p className="text-tekst-zacht">Je ziet geen namen. Alleen deze kinderen en hun ouders krijgen een uitnodiging; ouders beslissen of hun kind meedoet.</p>
          <div className="flex flex-col gap-3 tablet:flex-row">
            <PrimaireKnop href={`/tutor/lessen/inplannen?leerdoel=${encodeURIComponent(leerdoelId)}`}>
              Plan live les
              <Icoon naam="pijl-rechts" />
            </PrimaireKnop>
            <SecundaireKnop href="/tutor/uitlegbibliotheek">Gebruik bestaande uitleg</SecundaireKnop>
          </div>
          <form action={geenLesNodig} className="flex flex-col gap-2 rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:flex-row tablet:items-end">
            <input type="hidden" name="leerdoelId" value={leerdoelId} />
            <label className="flex flex-1 flex-col gap-1 font-semibold">
              Nog geen les nodig? Reden (een week opzij)
              <input name="reden" maxLength={300} placeholder="Bijvoorbeeld: eerst uitleg in de bibliotheek proberen" className="min-h-12 rounded-[12px] border border-rand-interactief px-3 font-normal" />
            </label>
            <SecundaireKnop type="submit">Nog geen les nodig</SecundaireKnop>
          </form>
        </>
      )}
    </>
  );
}
