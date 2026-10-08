import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { formatLesDatum, formatLesTijd, kanMeedoen } from "@/features/live/regels";
import { lesVoorKind } from "@/features/live/server";
import { haalActiefKind } from "@/lib/server/dal";
import { nietNu } from "../acties";
import { MeedoenKnop } from "./MeedoenKnop";

export const metadata: Metadata = { title: "Live les" };

type Props = PageProps<"/kind/lessen/[lesId]">;

/** L02: uitnodiging voor het kind. Niet meedoen heeft geen gevolgen. */
export default function KindLesPage({ params }: Props) {
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
  const { lesId } = await params;
  const kind = await haalActiefKind();
  const les = kind ? await lesVoorKind(kind.id, lesId) : null;
  if (!les) notFound();
  const vol = les.aangemeld >= les.capaciteit && les.uitnodiging.kindAanmelding !== "ja";
  const loopt = kanMeedoen(les.status, les.startOp, les.duurMin);

  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="titel-held">{les.titel}</h1>
          <p className="mt-2 subtitel font-semibold text-tekst-zacht">{leerdoelNaam(les.leerdoelId)}</p>
        </div>
        <Mees pose="helpt" breedte={170} className="hidden w-32 tablet:block" />
      </div>
      <p className="flex items-center gap-2 text-xl font-bold">
        <Icoon naam="tijd" className="size-6 text-actie-blauw" />
        {formatLesDatum(les.startOp)} om {formatLesTijd(les.startOp)} · {les.duurMin} minuten
      </p>
      <p className="text-lg">Je ziet en hoort {les.tutorVoornaam}. Je vragen gaan alleen naar de tutor.</p>

      {les.status === "geannuleerd" && <Melding>Deze les gaat niet door.</Melding>}
      {les.status === "afgelopen" &&
        (les.opnameGepubliceerd && les.uitnodiging.status === "toegestaan" ? (
          <PrimaireKnop href={`/kind/lessen/${les.id}/terugkijken`} groot className="self-start">
            Kijk de les terug
          </PrimaireKnop>
        ) : (
          <Melding>Deze les is voorbij.</Melding>
        ))}

      {(les.status === "gepland" || les.status === "live") && (
        <>
          {les.uitnodiging.status === "uitgenodigd" && <Melding>Vraag je ouder om toestemming. Je ouder ziet de uitnodiging in Mees.</Melding>}
          {les.uitnodiging.status === "geweigerd" && <Melding>Je doet deze keer niet mee. Je kunt gewoon verder oefenen.</Melding>}
          {les.uitnodiging.status === "toegestaan" &&
            (les.uitnodiging.kindAanmelding === "ja" ? (
              loopt ? (
                <PrimaireKnop href={`/kind/lessen/${les.id}/live`} groot className="self-start">
                  De les is begonnen: doe mee
                  <Icoon naam="pijl-rechts" />
                </PrimaireKnop>
              ) : (
                <Melding soort="succes">Je doet mee! Kom op tijd terug; de knop om mee te doen verschijnt hier als de les begint.</Melding>
              )
            ) : vol ? (
              <Melding>De les is vol. Misschien kun je hem later terugkijken.</Melding>
            ) : (
              <div className="flex flex-col gap-3 tablet:flex-row">
                <MeedoenKnop lesId={les.id} />
                <form action={nietNu}>
                  <input type="hidden" name="lesId" value={les.id} />
                  <SecundaireKnop type="submit" groot className="w-full">
                    Niet nu
                  </SecundaireKnop>
                </form>
              </div>
            ))}
        </>
      )}
    </>
  );
}
