"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { vindOnderdeelBijLeerdoel } from "@/content/onderwerpen";
import { BreukKaartjes } from "@/components/mees/Breuk";
import { Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { gastLimietBereikt, maakSessie, oefenConfig, openSessie, rondOvergangAf } from "@/features/oefenen/sessie";
import { useProfiel } from "@/components/mees/Profiel";
import { haalOpslag, useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";

const STANDAARD_DOEL = "breuken-vergelijken";

export function StartScherm() {
  const router = useRouter();
  const opslag = useOpslag();
  const { kind } = useProfiel();
  const [fout, setFout] = useState(false);
  const [bezig, setBezig] = useState(false);

  // Tijdens het starten blijft het voorstel staan, ook al bestaat de nieuwe sessie al.
  const open = opslag && !bezig ? openSessie(opslag) : null;
  // Voorstel: eerst een openstaande herhaling, anders het eerstvolgende beschikbare onderdeel.
  const voorstelDoel = opslag?.reviews[0]?.leerdoelId ?? STANDAARD_DOEL;
  const voorstel = vindOnderdeelBijLeerdoel(voorstelDoel) ?? vindOnderdeelBijLeerdoel(STANDAARD_DOEL)!;
  const isHerhaling = Boolean(opslag?.reviews[0]);
  const openOnderdeel = open ? vindOnderdeelBijLeerdoel(open.leerdoelId) : null;

  function startVoorstel() {
    if (!kind && gastLimietBereikt(haalOpslag())) {
      router.push("/voortgang-bewaren");
      return;
    }
    setBezig(true);
    let sessieId = "";
    const gelukt = wijzigOpslag((data) => {
      const r = maakSessie(data, {
        leerdoelId: voorstel.onderdeel.leerdoelId!,
        onderdeelId: voorstel.onderdeel.id,
        onderwerpId: voorstel.onderwerp.id,
        niveau: "past-bij-mij",
        aantal: oefenConfig.standaardAantal,
        bron: "voorstel",
      });
      sessieId = r.sessie.id;
      return r.data;
    });
    if (!sessieId) {
      setFout(true);
      setBezig(false);
      return;
    }
    if (!gelukt) setFout(true);
    router.push(`/kind/oefenen/${sessieId}`);
  }

  function hervat() {
    if (!open) return;
    wijzigOpslag((d) => rondOvergangAf(d, open.id));
    const bijgewerkt = haalOpslag().sessies[open.id];
    router.push(bijgewerkt?.status === "afgerond" ? `/kind/oefening/${open.id}/afgerond` : `/kind/oefenen/${open.id}`);
  }

  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:gap-8 tablet:py-10 desktop:max-w-[1160px] desktop:py-12">
      <section className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="subtitel text-actie-blauw">{kind ? `Hoi ${kind.voornaam}` : "Hoi!"}</p>
          <h1 className="titel-held mt-1">Wat wil je oefenen?</h1>
          <p className="mt-2 tekst-intro text-tekst-zacht">Mees helpt je op weg.</p>
        </div>
        <Mees pose="op-boeken" breedte={200} prioriteit className="w-24 shrink-0 tablet:w-36 desktop:mr-10 desktop:w-44" />
      </section>

      {fout && (
        <Melding soort="fout">Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.</Melding>
      )}

      {opslag === null ? (
        <div className="h-64 rounded-[16px] bg-blauw-zacht/60" aria-hidden />
      ) : open && openOnderdeel ? (
        <section aria-labelledby="hervat-titel" className="rounded-[16px] bg-blauw-zacht p-6 tablet:p-8 desktop:px-14 desktop:py-10">
          <p className="font-semibold text-actie-blauw">Je kunt verder waar je was.</p>
          <h2 id="hervat-titel" className="mt-1 titel-pagina">
            {openOnderdeel.onderdeel.naam}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-tekst-zacht">
            <Icoon naam="document" className="size-6" />
            Vraag {Math.min(open.index + 1, open.slots.length)} van {open.slots.length}
          </p>
          <PrimaireKnop groot className="mt-6 w-full tablet:w-auto" onClick={hervat}>
            Verder oefenen
            <Icoon naam="pijl-rechts" />
          </PrimaireKnop>
        </section>
      ) : (
        <section
          aria-labelledby="voorstel-titel"
          className="grid items-center gap-6 rounded-[16px] bg-blauw-zacht p-6 tablet:grid-cols-[1fr_auto] tablet:p-8 desktop:px-14 desktop:py-10"
        >
          <div>
            <p className="font-semibold text-actie-blauw">{isHerhaling ? "Laten we kijken of dit nog lukt." : "Mees stelt voor"}</p>
            <h2 id="voorstel-titel" className="mt-1 titel-pagina">
              {voorstel.onderdeel.naam}
            </h2>
            <p className="mt-2 tekst-intro text-tekst-zacht">{voorstel.onderdeel.omschrijving}</p>
            <p className="mt-4 flex items-center gap-2 text-tekst-zacht">
              <Icoon naam="document" className="size-6" />
              {oefenConfig.standaardAantal} vragen
            </p>
            <PrimaireKnop groot className="mt-6 w-full tablet:w-auto" onClick={startVoorstel} disabled={bezig}>
              {bezig ? "Even wachten…" : "Start oefenen"}
              {!bezig && <Icoon naam="pijl-rechts" />}
            </PrimaireKnop>
          </div>
          <div className="relative hidden justify-center px-6 py-4 tablet:flex desktop:px-16">
            <span className="absolute inset-0 m-auto h-40 w-64 rounded-full bg-wit/50" aria-hidden />
            <div className="relative">
              <BreukKaartjes links={[1, 3]} rechts={[2, 5]} teken="<" />
            </div>
          </div>
        </section>
      )}

      <section aria-label="Andere keuzes" className="grid grid-cols-2 gap-3 tablet:gap-4">
        <Link
          href="/kind/rekenen"
          className="flex flex-col gap-4 rounded-[16px] border border-rand-zacht bg-wit p-4 transition-colors hover:border-actie-blauw hover:bg-blauw-zacht tablet:flex-row tablet:items-center tablet:p-6"
        >
          <span className="grid size-14 shrink-0 grid-cols-2 gap-1.5 p-1" aria-hidden>
            <span className="rounded-[5px] bg-actie-blauw" />
            <span className="rounded-[5px] bg-[#b9dcfb]" />
            <span className="rounded-[5px] bg-[#b9dcfb]" />
            <span className="rounded-[5px] bg-geel" />
          </span>
          <span className="flex flex-1 items-end justify-between gap-2 tablet:items-center">
            <span>
              <span className="block text-lg font-bold leading-snug tablet:text-xl">
                Kies zelf<span className="hidden tablet:inline"> een onderwerp</span>
              </span>
              <span className="mt-0.5 block tekst-klein text-tekst-zacht">Kies wat je wilt oefenen.</span>
            </span>
            <Icoon naam="chevron-rechts" className="size-6 text-actie-blauw" />
          </span>
        </Link>

        <div className="flex flex-col gap-4 rounded-[16px] border border-rand-zacht bg-wit p-4 tablet:flex-row tablet:items-center tablet:p-6">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-blauw-zacht text-3xl font-extrabold text-[#d99a00]" aria-hidden>
            ×
          </span>
          <span>
            <span className="block text-lg font-bold leading-snug tablet:text-xl">Tafeltrainer</span>
            <span className="mt-0.5 block tekst-klein text-tekst-zacht">Komt binnenkort.</span>
          </span>
        </div>
      </section>

      <p className="flex items-center justify-center gap-3 text-center tekst-klein text-tekst-zacht">
        <span aria-hidden className="text-xl">🌱</span>
        Een kort oefenmoment is ook waardevol.
      </p>
    </div>
  );
}
