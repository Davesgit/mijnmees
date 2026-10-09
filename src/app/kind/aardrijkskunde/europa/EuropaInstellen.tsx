"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Dialoog } from "@/components/mees/Dialoog";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { KeuzeKaart, StapKop } from "@/components/mees/KeuzeKaart";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { useProfiel } from "@/components/mees/Profiel";
import { alleEuropaVragen, namen } from "@/features/oefenen/europa-vragen";
import { europaMeta, europaOnderwerpen, landenVanGebieden, telEuropaOnderdelen, type EuropaOnderwerp } from "@/features/oefenen/europa-sessie";
import { gastLimietBereikt, maakEuropaSessie } from "@/features/oefenen/sessie";
import { haalOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";

const hoofdGebieden = ["heel", "north", "west", "south", "east"];
const meerGebieden = ["central", "southeast"];
const gebiedNaam = (id: string) => (id === "heel" ? "Heel Europa" : (europaMeta.gebieden.find((g) => g.id === id)?.naam ?? id));

/** Meerkeuze-kaart (checkbox) voor gebieden en onderwerpen. */
function VinkKaart({ gekozen, onWissel, titel, icoon, uitgeschakeld, reden }: { gekozen: boolean; onWissel: () => void; titel: string; icoon?: AlleIcoonNamen; uitgeschakeld?: boolean; reden?: string }) {
  return (
    <label
      className={`flex min-h-16 items-center gap-3 rounded-[16px] border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus ${
        uitgeschakeld
          ? "cursor-default border-rand-zacht bg-wit text-tekst-zacht"
          : gekozen
            ? "cursor-pointer border-2 border-actie-blauw bg-blauw-zacht p-[15px]"
            : "cursor-pointer border-rand-interactief bg-wit hover:bg-blauw-zacht"
      }`}
    >
      <input type="checkbox" className="sr-only" checked={gekozen} disabled={uitgeschakeld} onChange={onWissel} />
      {icoon && <Icoon naam={icoon} className={`size-7 ${uitgeschakeld ? "" : "text-actie-blauw"}`} />}
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug">{titel}</span>
        {reden && <span className="block tekst-klein text-tekst-zacht">{reden}</span>}
      </span>
      <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-[8px] border-2 ${gekozen ? "border-actie-blauw bg-actie-blauw text-wit" : "border-rand-interactief bg-wit"}`}>
        {gekozen && <Icoon naam="check" className="size-5" />}
      </span>
    </label>
  );
}

export function EuropaInstellen() {
  const router = useRouter();
  const { kind } = useProfiel();
  const [gebieden, setGebieden] = useState<string[]>(["west"]);
  const [meerOpen, setMeerOpen] = useState(false);
  const [eigenLanden, setEigenLanden] = useState<string[] | null>(null);
  const [kiezerOpen, setKiezerOpen] = useState(false);
  const [concept, setConcept] = useState<string[]>([]);
  const [onderwerpen, setOnderwerpen] = useState<EuropaOnderwerp[]>(["landen"]);
  const [vorm, setVorm] = useState<"afwisselend" | "puzzel">("afwisselend");
  const [fout, setFout] = useState<string | null>(null);
  // "Even wachten…" hoort bij het laden van de volgende pagina. Ga je terug, dan staat de knop vanzelf weer goed
  // (Next bewaart verlaten pagina's, inclusief hun toestand).
  const [bezigLokaal, setBezig] = useState(false);
  const [navigeert, startNavigatie] = useTransition();
  const bezig = bezigLokaal || navigeert;

  const landen = useMemo(() => eigenLanden ?? landenVanGebieden(gebieden), [eigenLanden, gebieden]);
  const liggingMogelijk = useMemo(
    () => alleEuropaVragen().some((v) => v.module === "relative" && (v.vereist ?? [v.doel]).every((id) => landen.includes(id))),
    [landen],
  );
  const aantal = useMemo(
    () => (vorm === "puzzel" ? landen.length : telEuropaOnderdelen(landen, onderwerpen.filter((o) => o !== "ligging" || liggingMogelijk))),
    [landen, onderwerpen, vorm, liggingMogelijk],
  );

  function wisselGebied(id: string) {
    setEigenLanden(null);
    setFout(null);
    setGebieden((g) => {
      if (id === "heel") return g.includes("heel") ? [] : ["heel"];
      const zonderHeel = g.filter((x) => x !== "heel");
      return zonderHeel.includes(id) ? zonderHeel.filter((x) => x !== id) : [...zonderHeel, id];
    });
  }

  function wisselOnderwerp(id: EuropaOnderwerp) {
    setFout(null);
    setOnderwerpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }

  function start() {
    const gekozenOnderwerpen = onderwerpen.filter((o) => o !== "ligging" || liggingMogelijk);
    if (landen.length === 0 || (vorm === "afwisselend" && gekozenOnderwerpen.length === 0)) {
      setFout("Kies een gebied en een onderwerp.");
      return;
    }
    if (vorm === "puzzel" && landen.length < 2) {
      setFout("Kies minstens twee landen om te puzzelen.");
      return;
    }
    if (!kind && gastLimietBereikt(haalOpslag())) {
      router.push("/voortgang-bewaren");
      return;
    }
    setBezig(true);
    let sessieId = "";
    try {
      wijzigOpslag((data) => {
        const r = maakEuropaSessie(data, { gebieden: eigenLanden ? [] : gebieden, landen, onderwerpen: gekozenOnderwerpen, vorm });
        sessieId = r.sessie.id;
        return r.data;
      });
    } catch {
      setFout("Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.");
      setBezig(false);
      return;
    }
    startNavigatie(() => {
      setBezig(false);
      router.push(`/kind/aardrijkskunde/europa/${sessieId}`);
    });
  }

  const samenvatting = `${eigenLanden ? `${eigenLanden.length} zelf gekozen landen` : gebieden.map(gebiedNaam).join(" + ") || "Nog geen gebied"}${
    vorm === "puzzel" ? " · Landenpuzzel" : onderwerpen.length ? ` · ${onderwerpen.map((o) => europaOnderwerpen.find((x) => x.id === o)!.naam).join(", ")}` : ""
  }`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mees-content flex flex-col py-6 tablet:max-w-[1100px] tablet:py-8 desktop:py-10">
        <TerugLink href="/kind/start">Start</TerugLink>
        <div className="mt-2 flex items-center justify-between gap-6">
          <div>
            <h1 className="titel-held">Europa</h1>
            <p className="mt-2 subtitel font-semibold text-tekst-zacht">Stel je oefening samen.</p>
          </div>
          <Mees pose="helpt" breedte={220} className="hidden w-44 tablet:block desktop:w-52" />
        </div>

        <div className="mt-6 flex flex-col gap-8 tablet:mt-8">
          <fieldset>
            <StapKop nummer={1} id="gebied">Welk gebied wil je oefenen?</StapKop>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-5">
              {[...hoofdGebieden, ...(meerOpen ? meerGebieden : [])].map((id) => (
                <VinkKaart key={id} gekozen={!eigenLanden && gebieden.includes(id)} onWissel={() => wisselGebied(id)} titel={gebiedNaam(id)} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="tekst-klein text-tekst-zacht">Je kunt meerdere gebieden kiezen.</p>
              <div className="flex flex-wrap gap-1">
                {!meerOpen && (
                  <button type="button" onClick={() => setMeerOpen(true)} className="inline-flex min-h-12 items-center rounded-[12px] px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht">
                    Meer gebieden
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setConcept(landen);
                    setKiezerOpen(true);
                  }}
                  className="inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 font-semibold text-actie-blauw underline underline-offset-4 hover:bg-blauw-zacht"
                >
                  <Icoon naam="landen" className="size-5" />
                  Kies zelf landen
                </button>
              </div>
            </div>
            {eigenLanden && (
              <p className="mt-2 rounded-[12px] bg-blauw-zacht p-3">
                Je oefent met {eigenLanden.length} zelf gekozen landen.{" "}
                <button type="button" onClick={() => setEigenLanden(null)} className="font-bold text-actie-blauw underline underline-offset-4">
                  Weer per gebied kiezen
                </button>
              </p>
            )}
          </fieldset>

          <fieldset>
            <StapKop nummer={2} id="vorm">Hoe wil je oefenen?</StapKop>
            <div className="grid gap-3 tablet:grid-cols-2 tablet:gap-4">
              <KeuzeKaart naam="vorm" waarde="afwisselend" gekozen={vorm === "afwisselend"} onKies={() => setVorm("afwisselend")} titel="Afwisselend oefenen" omschrijving="Aanwijzen en antwoorden kiezen." icoon={<Icoon naam="landen" className="size-8" />} />
              <KeuzeKaart naam="vorm" waarde="puzzel" gekozen={vorm === "puzzel"} onKies={() => setVorm("puzzel")} titel="Landenpuzzel" omschrijving="Leg landen op de juiste plek." icoon={<Icoon naam="puzzel" className="size-8" />} />
            </div>
          </fieldset>

          {vorm === "afwisselend" && (
            <fieldset>
              <StapKop nummer={3} id="onderwerpen">Wat wil je oefenen?</StapKop>
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-5">
                {europaOnderwerpen.map((o) => (
                  <VinkKaart
                    key={o.id}
                    gekozen={onderwerpen.includes(o.id) && (o.id !== "ligging" || liggingMogelijk)}
                    onWissel={() => wisselOnderwerp(o.id)}
                    titel={o.naam}
                    icoon={o.icoon as AlleIcoonNamen}
                    uitgeschakeld={o.id === "ligging" && !liggingMogelijk}
                    reden={o.id === "ligging" && !liggingMogelijk ? "Nog niet voor dit gebied." : undefined}
                  />
                ))}
              </div>
              <p className="mt-2 tekst-klein text-tekst-zacht">Kies één of meer onderwerpen.</p>
            </fieldset>
          )}

          {fout && <Melding soort="fout">{fout}</Melding>}
        </div>
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 mt-auto border-t border-rand-zacht bg-wit/95 pb-4 pt-4 backdrop-blur tablet:bottom-0 tablet:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mees-content flex flex-col gap-3 tablet:max-w-[1100px] tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <p className="font-bold">{samenvatting}</p>
            <p className="tekst-klein text-tekst-zacht">
              {vorm === "puzzel" ? `${aantal} landen om te leggen.` : `Je oefent alles uit je selectie: ${aantal} onderdelen.`} Je kunt altijd stoppen.
            </p>
          </div>
          <PrimaireKnop groot onClick={start} disabled={bezig} className="w-full tablet:w-auto">
            {bezig ? "Even wachten…" : "Start oefenen"}
            {!bezig && <Icoon naam="pijl-rechts" />}
          </PrimaireKnop>
        </div>
      </div>

      <Dialoog open={kiezerOpen} onSluit={() => setKiezerOpen(false)} titel="Kies zelf landen">
        <p className="tekst-klein text-tekst-zacht">{concept.length} landen gekozen.</p>
        <ul className="mt-3 grid max-h-[50vh] grid-cols-1 gap-1 overflow-auto min-[420px]:grid-cols-2">
          {[...europaMeta.landen].sort((a, b) => (namen[a] ?? a).localeCompare(namen[b] ?? b, "nl")).map((id) => (
            <li key={id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-2 hover:bg-blauw-zacht">
                <input
                  type="checkbox"
                  className="size-5 accent-actie-blauw"
                  checked={concept.includes(id)}
                  onChange={() => setConcept((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))}
                />
                {namen[id] ?? id}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <PrimaireKnop
            disabled={concept.length === 0}
            onClick={() => {
              setEigenLanden(concept);
              setKiezerOpen(false);
            }}
          >
            Gebruik deze landen
          </PrimaireKnop>
          <SecundaireKnop onClick={() => setKiezerOpen(false)}>Annuleren</SecundaireKnop>
        </div>
      </Dialoog>
    </div>
  );
}
