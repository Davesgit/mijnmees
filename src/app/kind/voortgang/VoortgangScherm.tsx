"use client";

import Link from "next/link";
import { Laden } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { OnderdeelPictogram } from "@/components/mees/OnderdeelPictogram";
import { vindOnderdeelBijLeerdoel } from "@/content/onderwerpen";
import { openSessie } from "@/features/oefenen/sessie";
import { berekenBewijs, type BewijsStatus } from "@/features/voortgang/bewijs";
import { useOpslag } from "@/lib/opslag/lokaal";

const groepen: { status: BewijsStatus; titel: string; uitleg: string; regel: string }[] = [
  { status: "gaat-zelfstandig", titel: "Gaat zelfstandig", uitleg: "Dit ging goed tijdens meerdere oefenmomenten.", regel: "Dit lukt je zonder hulp." },
  { status: "aan-het-oefenen", titel: "Aan het oefenen", uitleg: "Hier kun je verder oefenen.", regel: "Blijf dit oefenen." },
  { status: "nog-eens-oefenen", titel: "Nog eens oefenen", uitleg: "Dit heb je eerder geoefend. Kijk of het nog steeds lukt.", regel: "Kijk of dit nog lukt." },
];

export function VoortgangScherm() {
  const opslag = useOpslag();
  if (opslag === null) return <Laden />;

  const bewijs = berekenBewijs(opslag);
  const open = openSessie(opslag);
  const openOnderdeel = open ? vindOnderdeelBijLeerdoel(open.leerdoelId) : null;

  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:gap-8 tablet:py-8 desktop:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="titel-held">Jouw voortgang</h1>
          <p className="mt-2 tekst-intro text-tekst-zacht">Kijk wat je al hebt geoefend.</p>
        </div>
        <Mees pose="denkt-na" breedte={160} className="w-20 shrink-0 tablet:w-32 desktop:mr-12 desktop:w-36" />
      </div>

      {open && openOnderdeel && (
        <div className="flex flex-col gap-4 rounded-[16px] bg-blauw-zacht p-5 tablet:flex-row tablet:items-center tablet:justify-between tablet:p-6">
          <div>
            <p className="font-semibold text-actie-blauw">Je kunt verder waar je was.</p>
            <p className="subtitel">{openOnderdeel.onderdeel.naam}</p>
          </div>
          <PrimaireKnop href={`/kind/oefenen/${open.id}`}>
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
        <section aria-labelledby="rekenen-titel" className="flex flex-col gap-4">
          <div>
            <h2 id="rekenen-titel" className="subtitel">Rekenen</h2>
            <p className="tekst-klein text-tekst-zacht">Mees kijkt naar meerdere oefenmomenten.</p>
          </div>
          {groepen.map((g) => {
            const items = bewijs.filter((b) => b.status === g.status);
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
                    if (!o) return null;
                    return (
                      <li key={b.leerdoelId} className="flex flex-wrap items-center gap-4 px-5 py-4 tablet:px-6">
                        <span className="grid h-14 w-20 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
                          <OnderdeelPictogram soort={o.onderdeel.pictogram} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-lg font-bold">{o.onderdeel.naam}</span>
                          <span className="block tekst-klein text-tekst-zacht">{g.regel}</span>
                        </span>
                        <Link
                          href={`/kind/oefening/instellen?onderdeel=${o.onderdeel.id}`}
                          className="inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 font-bold text-actie-blauw hover:bg-blauw-zacht"
                        >
                          Oefenen
                          <span className="sr-only"> {o.onderdeel.naam}</span>
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
      )}
    </div>
  );
}
