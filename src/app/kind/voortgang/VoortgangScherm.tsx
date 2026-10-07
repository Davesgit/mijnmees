"use client";

import Link from "next/link";
import { Laden } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { OnderdeelPictogram } from "@/components/mees/OnderdeelPictogram";
import { vindOnderdeelBijLeerdoel } from "@/content/onderwerpen";
import { leerdoelNaam, leerdoelOefenRoute, leerdoelSoort } from "@/features/oefenen/weergave";
import { openSessie, sessieRoute } from "@/features/oefenen/sessie";
import { sessieNaam } from "@/features/oefenen/weergave";
import { Icoon as LeerIcoon } from "@/components/mees/Icoon";
import { berekenBewijs, type BewijsStatus } from "@/features/voortgang/bewijs";
import { useOpslag } from "@/lib/opslag/lokaal";

const groepen: { status: BewijsStatus; titel: string; uitleg: string; regel: string }[] = [
  {
    status: "gaat-zelfstandig",
    titel: "Gaat zelfstandig",
    uitleg: "Dit ging goed tijdens meerdere oefenmomenten.",
    regel: "Dit lukt je zonder hulp.",
  },
  { status: "aan-het-oefenen", titel: "Aan het oefenen", uitleg: "Hier kun je verder oefenen.", regel: "Blijf dit oefenen." },
  {
    status: "nog-eens-oefenen",
    titel: "Nog eens oefenen",
    uitleg: "Dit heb je eerder geoefend. Kijk of het nog steeds lukt.",
    regel: "Kijk of dit nog lukt.",
  },
];

export function VoortgangScherm() {
  const opslag = useOpslag();
  if (opslag === null) return <Laden />;

  const bewijs = berekenBewijs(opslag);
  const open = openSessie(opslag);

  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:gap-8 tablet:py-8 desktop:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="titel-held">Jouw voortgang</h1>
          <p className="mt-2 tekst-intro text-tekst-zacht">Kijk wat je al hebt geoefend.</p>
        </div>
        <Mees pose="denkt-na" breedte={160} className="w-20 shrink-0 tablet:w-32 desktop:mr-12 desktop:w-36" />
      </div>

      {open && (
        <div className="flex flex-col gap-4 rounded-[16px] bg-blauw-zacht p-5 tablet:flex-row tablet:items-center tablet:justify-between tablet:p-6">
          <div>
            <p className="font-semibold text-actie-blauw">Je kunt verder waar je was.</p>
            <p className="subtitel">{sessieNaam(open)}</p>
          </div>
          <PrimaireKnop href={sessieRoute(open)}>
            Verder oefenen
            <Icoon naam="pijl-rechts" />
          </PrimaireKnop>
        </div>
      )}

      {bewijs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[16px] border border-rand-zacht p-8 text-center">
          <p className="text-lg">Hier komt je voortgang zodra je hebt geoefend.</p>
          <PrimaireKnop href="/kind/start">Begin met oefenen</PrimaireKnop>
        </div>
      ) : (
        vakken.map((vak) => {
          const vakBewijs = bewijs.filter((b) => (leerdoelSoort(b.leerdoelId) === "europa") === (vak.id === "aardrijkskunde"));
          if (vakBewijs.length === 0) return null;
          return (
            <section key={vak.id} aria-labelledby={`${vak.id}-titel`} className="flex flex-col gap-4">
              <div>
                <h2 id={`${vak.id}-titel`} className="subtitel">
                  {vak.naam}
                </h2>
                <p className="tekst-klein text-tekst-zacht">Mees kijkt naar meerdere oefenmomenten.</p>
              </div>
              {groepen.map((g) => {
                const items = vakBewijs.filter((b) => b.status === g.status);
                if (items.length === 0) return null;
                return (
                  <div key={g.status} className="overflow-hidden rounded-[16px] border border-rand-zacht">
                    <div className="bg-[#f2f8ff] px-5 py-4 tablet:px-6">
                      <h3 className="text-xl font-extrabold">{g.titel}</h3>
                      <p className="tekst-klein text-tekst-zacht">{g.uitleg}</p>
                    </div>
                    <ul className="divide-y divide-rand-zacht">
                      {items.map((b) => {
                        const o = vindOnderdeelBijLeerdoel(b.leerdoelId);
                        const soort = leerdoelSoort(b.leerdoelId);
                        return (
                          <li key={b.leerdoelId} className="flex flex-wrap items-center gap-4 px-5 py-4 tablet:px-6">
                            <span className="grid h-14 w-20 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
                              {o ? (
                                <OnderdeelPictogram soort={o.onderdeel.pictogram} />
                              ) : (
                                <LeerIcoon naam={soort === "tafels" ? "tafels" : "landen"} className="size-7" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-lg font-bold">{leerdoelNaam(b.leerdoelId)}</span>
                              <span className="block tekst-klein text-tekst-zacht">{g.regel}</span>
                            </span>
                            <Link
                              href={leerdoelOefenRoute(b.leerdoelId)}
                              className="inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 font-bold text-actie-blauw hover:bg-blauw-zacht"
                            >
                              Oefenen
                              <span className="sr-only"> {leerdoelNaam(b.leerdoelId)}</span>
                              <Icoon naam="pijl-rechts" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </section>
          );
        })
      )}
    </div>
  );
}

const vakken = [
  { id: "rekenen", naam: "Rekenen" },
  { id: "aardrijkskunde", naam: "Aardrijkskunde" },
];
