"use client";

import Image from "next/image";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { vindWeetje, weetjesPlekken } from "@/content/weetjes";
import { useOpslag } from "@/lib/opslag/lokaal";

function Kompas() {
  return (
    <svg viewBox="0 0 64 64" className="size-20 text-[#5b7bb5]" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <circle cx="32" cy="34" r="22" />
        <circle cx="32" cy="34" r="17" strokeDasharray="2 4" />
        <path d="M28 10h8M32 10v2" strokeLinecap="round" />
        <path d="m32 20 4 14-4 14-4-14z" fill="#eaf5ff" />
        <path d="m18 34 14-4 14 4-14 4z" />
      </g>
    </svg>
  );
}

export function WeetjesboekScherm() {
  const opslag = useOpslag();
  if (opslag === null) return <Laden />;

  const ontdekt = opslag.weetjes.map((w) => vindWeetje(w.weetjeId)).filter((w) => w !== null);
  const nogTeOntdekken = Math.max(0, weetjesPlekken - ontdekt.length);

  return (
    <div className="flex-1 bg-gradient-to-b from-[#f3f8fe] to-wit">
      <div className="mees-content flex flex-col gap-6 py-6 tablet:gap-8 tablet:py-8 desktop:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="titel-held">Je weetjesboek</h1>
            <p className="mt-2 tekst-intro text-tekst-zacht">Ontdek iets nieuws. Van de diepzee tot de bergen.</p>
          </div>
          <Mees pose="op-boeken" breedte={160} className="w-20 shrink-0 tablet:w-32 desktop:mr-12 desktop:w-36" />
        </div>

        {ontdekt.length === 0 && (
          <Melding>
            Je eerste weetje verschijnt hier na het oefenen.{" "}
            <PrimaireKnop href="/kind/start" className="mt-3 flex w-full tablet:inline-flex tablet:w-auto">
              Begin met oefenen
            </PrimaireKnop>
          </Melding>
        )}

        <ul className="grid gap-4 min-[560px]:grid-cols-2 desktop:grid-cols-3">
          {ontdekt.map((w) => (
            <li key={w.id} className="flex flex-col overflow-hidden rounded-[16px] border border-rand-zacht bg-wit">
              <div className="relative">
                <Image src={w.foto} alt={w.alt} width={1536} height={1024} sizes="(min-width: 1024px) 380px, (min-width: 560px) 50vw, 100vw" className="aspect-[16/9] w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-inkt/85 px-3 py-1 text-[0.9375rem] font-bold text-wit">{w.categorie}</span>
              </div>
              <div className="flex flex-1 flex-col gap-1 p-5">
                <h2 className="subtitel">{w.titel}</h2>
                <p className="text-tekst-zacht">{w.vraag}</p>
                <PrimaireKnop href={`/kind/weetjes/${w.id}`} className="mt-3 self-start">
                  Ontdek het weetje
                  <Icoon naam="pijl-rechts" />
                </PrimaireKnop>
              </div>
            </li>
          ))}
          {Array.from({ length: nogTeOntdekken }, (_, i) => (
            <li
              key={`leeg-${i}`}
              className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-rand-zacht bg-[#f7fbff] p-6 text-center"
            >
              <Kompas />
              <p className="subtitel">Nog te ontdekken</p>
              <p className="tekst-klein text-tekst-zacht">Er wachten nog meer bijzondere verhalen.</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
