import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { PrimaireKnop, SecundaireKnop, TekstKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { formatLesDatum, formatLesTijd, type LesStatus } from "@/features/live/regels";
import { haalTutorLessen } from "@/features/live/server";
import { vereisTutor } from "@/lib/server/rollen";
import { annuleerLes } from "../../les-acties";

export const metadata: Metadata = { title: "Mijn lessen" };

const statusNaam: Record<LesStatus, string> = { gepland: "Gepland", live: "Nu live", afgelopen: "Afgelopen", geannuleerd: "Geannuleerd" };

export default function LessenPage({ searchParams }: PageProps<"/tutor/lessen">) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10">
      <div>
        <h1 className="titel-held">Mijn lessen</h1>
        <p className="mt-1 subtitel font-semibold text-tekst-zacht">Live uitleg voor een kleine groep.</p>
      </div>
      <Suspense fallback={<Laden />}>
        <Inhoud searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ searchParams }: Pick<PageProps<"/tutor/lessen">, "searchParams">) {
  const tutor = await vereisTutor("/tutor/lessen");
  const [lessen, params] = await Promise.all([haalTutorLessen(tutor), searchParams]);
  return (
    <>
      {params.gepland && <Melding soort="succes">De les is gepland. {params.gepland} kinderen en hun ouders zien de uitnodiging in Mees.</Melding>}
      {params.afgelopen && <Melding soort="succes">De les is afgelopen. Bedankt!</Melding>}
      {lessen.length === 0 ? (
        <p className="rounded-[16px] border border-rand-zacht bg-wit p-6">Je hebt nog geen lessen. Een les plan je vanuit een lesvoorstel op je dashboard.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lessen.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:flex-row tablet:items-center tablet:justify-between">
              <div>
                <p className="text-lg font-bold">{l.titel}</p>
                <p className="tekst-klein text-tekst-zacht">
                  {leerdoelNaam(l.leerdoelId)} · {formatLesDatum(l.startOp)} om {formatLesTijd(l.startOp)} · {l.duurMin} min
                </p>
                <p className="tekst-klein">
                  <span className={`font-bold ${l.status === "live" ? "text-fout" : ""}`}>{statusNaam[l.status]}</span> · {l.uitgenodigd} uitgenodigd · {l.toegestaan} met toestemming · {l.aangemeld}/{l.capaciteit} aangemeld
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(l.status === "gepland" || l.status === "live") && <PrimaireKnop href={`/tutor/lessen/${l.id}/live`}>{l.status === "live" ? "Terug naar de les" : "Open les"}</PrimaireKnop>}
                {l.status === "afgelopen" && l.opnameUitlegId && <SecundaireKnop href={`/tutor/uitleg/${l.opnameUitlegId}/controle?les=1`}>Controleer opname</SecundaireKnop>}
                {l.status === "gepland" && (
                  <form action={annuleerLes}>
                    <input type="hidden" name="lesId" value={l.id} />
                    <TekstKnop type="submit">Annuleer</TekstKnop>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
