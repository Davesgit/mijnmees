"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { vindOnderdeelBijLeerdoel } from "@/content/onderwerpen";
import { BreukKaartjes } from "@/components/mees/Breuk";
import { Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { gastLimietBereikt, maakSessie, oefenConfig, openSessie, rondOvergangAf, sessieRoute } from "@/features/oefenen/sessie";
import { sessieNaam } from "@/features/oefenen/weergave";
import { useProfiel } from "@/components/mees/Profiel";
import { haalOpslag, useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";

const STANDAARD_DOEL = "breuken-vergelijken";

export function StartScherm() {
  const router = useRouter();
  const opslag = useOpslag();
  const { kind } = useProfiel();
  const [fout, setFout] = useState(false);
  // "Even wachten…" hoort bij het laden van de volgende pagina. Ga je terug, dan staat de knop vanzelf weer goed
  // (Next bewaart verlaten pagina's, inclusief hun toestand).
  const [bezigLokaal, setBezig] = useState(false);
  const [navigeert, startNavigatie] = useTransition();
  const bezig = bezigLokaal || navigeert;

  // Tijdens het starten blijft het voorstel staan, ook al bestaat de nieuwe sessie al.
  const open = opslag && !bezig ? openSessie(opslag) : null;
  // Voorstel: eerst een openstaande herhaling, anders het eerstvolgende beschikbare onderdeel.
  const voorstelDoel = opslag?.reviews[0]?.leerdoelId ?? STANDAARD_DOEL;
  const voorstel = vindOnderdeelBijLeerdoel(voorstelDoel) ?? vindOnderdeelBijLeerdoel(STANDAARD_DOEL)!;
  const isHerhaling = Boolean(opslag?.reviews[0]);


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
    startNavigatie(() => {
      setBezig(false);
      router.push(`/kind/oefenen/${sessieId}`);
    });
  }

  function hervat() {
    if (!open) return;
    wijzigOpslag((d) => rondOvergangAf(d, open.id));
    const bijgewerkt = haalOpslag().sessies[open.id];
    if (bijgewerkt) router.push(sessieRoute(bijgewerkt));
  }

  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:gap-8 tablet:py-10 desktop:max-w-[1160px] desktop:py-12">
      <section className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="subtitel text-actie-blauw">{kind ? `Hoi ${kind.voornaam}` : "Hoi!"}</p>
          <h1 className="titel-held mt-1">Wat wil je oefenen?</h1>
          <p className="mt-2 tekst-intro text-tekst-zacht">Mees helpt je op weg.</p>
        </div>
        <Mees pose="op-boeken" breedte={200} prioriteit className="w-24 shrink-0 -scale-x-100 tablet:w-36 desktop:mr-10 desktop:w-44" />
      </section>

      {fout && (
        <Melding soort="fout">Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.</Melding>
      )}

      {opslag === null ? (
        <div className="h-64 rounded-[16px] bg-blauw-zacht/60" aria-hidden />
      ) : open ? (
        <section aria-labelledby="hervat-titel" className="rounded-[16px] bg-blauw-zacht p-6 tablet:p-8 desktop:px-14 desktop:py-10">
          <p className="font-semibold text-actie-blauw">Je kunt verder waar je was.</p>
          <h2 id="hervat-titel" className="mt-1 titel-pagina">
            {sessieNaam(open)}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-tekst-zacht">
            <Icoon naam="document" className="size-6" />
            {open.soort === "puzzel" ? `${open.slots.filter((s) => s.uitkomst).length} van ${open.slots.length} landen geplaatst` : `Vraag ${Math.min(open.index + 1, open.slots.length)} van ${open.slots.length}`}
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
        <KeuzeTegel
          href="/kind/rekenen"
          titel="Kies zelf"
          tekst="Kies wat je wilt oefenen."
          beeld={
            <span className="grid size-12 grid-cols-2 gap-1.5 p-1">
              <span className="rounded-[5px] bg-actie-blauw" />
              <span className="rounded-[5px] bg-[#b9dcfb]" />
              <span className="rounded-[5px] bg-[#b9dcfb]" />
              <span className="rounded-[5px] bg-geel" />
            </span>
          }
        />
        <KeuzeTegel href="/kind/tafeltrainer" titel="Tafeltrainer" tekst="Oefen één of meer tafels." beeld={<span className="text-4xl font-extrabold leading-none text-[#d99a00]">×</span>} />
        <KeuzeTegel href="/kind/niveaubepaling" titel="Wat past bij jou?" tekst="Ontdek waar je kunt beginnen." beeld={<Icoon naam="voortgang" className="size-7 text-actie-blauw" />} />
        <KeuzeTegel href="/werkbladen/samenstellen" titel="Op papier" tekst="Maak een werkblad om te printen." beeld={<Icoon naam="printer" className="size-7 text-actie-blauw" />} />
      </section>

      <p className="flex items-center justify-center gap-3 text-center tekst-klein text-tekst-zacht">
        <span aria-hidden className="text-xl">🌱</span>
        Een kort oefenmoment is ook waardevol.
      </p>
    </div>
  );
}

/** Gelijke keuzetegels: op de telefoon 2 × 2, rustig en even groot. */
function KeuzeTegel({ href, titel, tekst, beeld }: { href: string; titel: string; tekst: string; beeld: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-h-36 flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-4 transition-colors hover:border-actie-blauw hover:bg-blauw-zacht active:bg-blauw-zacht tablet:min-h-0 tablet:flex-row tablet:items-center tablet:p-6"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-blauw-zacht" aria-hidden>
        {beeld}
      </span>
      <span className="flex flex-1 items-start justify-between gap-2 tablet:items-center">
        <span>
          <span className="block text-lg font-bold leading-snug tablet:text-xl">{titel}</span>
          <span className="mt-0.5 block tekst-klein text-tekst-zacht">{tekst}</span>
        </span>
        <Icoon naam="chevron-rechts" className="size-6 shrink-0 self-end text-actie-blauw tablet:self-center" />
      </span>
    </Link>
  );
}
