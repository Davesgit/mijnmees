"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { KeuzeKaart, StapKop } from "@/components/mees/KeuzeKaart";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { TAFELS } from "@/features/oefenen/tafel-vragen";
import type { Niveau } from "@/features/oefenen/vragen";
import { WerkbladBlad } from "@/features/werkbladen/WerkbladBlad";
import {
  bewaarLokaalWerkblad,
  kiesWerkbladVragen,
  maakWerkblad,
  nieuweSeed,
  werkbladConfig,
  werkbladTitel,
  type WerkbladInstellingen,
  type WerkbladOnderwerp,
} from "@/features/werkbladen/werkblad";
import { bewaarWerkblad } from "../acties";

const niveaus: { waarde: Niveau; titel: string; omschrijving: string }[] = [
  { waarde: "makkelijk", titel: "Makkelijk", omschrijving: "Eerst de basis." },
  { waarde: "past-bij-mij", titel: "Past bij mij", omschrijving: "Een goede mix." },
  { waarde: "uitdagend", titel: "Uitdagend", omschrijving: "Een stap verder." },
];

function leesBegin(params: URLSearchParams): WerkbladInstellingen {
  const tafels = (params.get("tafels") ?? "").split(",").map(Number).filter((t) => TAFELS.includes(t as (typeof TAFELS)[number]));
  const niveau = params.get("niveau");
  const onderwerpen = (params.get("onderwerpen") ?? (tafels.length ? "tafels" : "breuken")).split(",").filter((o): o is WerkbladOnderwerp => o === "breuken" || o === "tafels");
  const aantal = Number(params.get("aantal"));
  return {
    vak: "rekenen",
    onderwerpen: onderwerpen.length ? onderwerpen : ["breuken"],
    niveau: niveau === "makkelijk" || niveau === "uitdagend" ? niveau : "past-bij-mij",
    tafels,
    bewerkingen: params.get("bewerkingen") === "x,:" ? ["x", ":"] : params.get("bewerkingen") === ":" ? [":"] : ["x"],
    aantal: aantal >= werkbladConfig.minAantal && aantal <= werkbladConfig.maxAantal ? aantal : werkbladConfig.standaardAantal,
    seed: Number(params.get("seed")) || 1,
  };
}

/** W01: vak eerst, dan onderwerpen en onderdelen; het voorbeeld staat onder de instellingen. */
export function Samenstellen() {
  const router = useRouter();
  const params = useSearchParams();
  const [inst, setInst] = useState<WerkbladInstellingen>(() => leesBegin(params));
  const [voorbeeldOpen, setVoorbeeldOpen] = useState(true);
  const [fout, setFout] = useState<string | null>(null);
  // "Even wachten…" hoort bij het laden van de volgende pagina. Ga je terug, dan staat de knop vanzelf weer goed
  // (Next bewaart verlaten pagina's, inclusief hun toestand).
  const [bezigLokaal, setBezig] = useState(false);
  const [navigeert, startNavigatie] = useTransition();
  const bezig = bezigLokaal || navigeert;

  const vragen = useMemo(() => kiesWerkbladVragen(inst), [inst]);
  const pas = (w: Partial<WerkbladInstellingen>) => {
    setFout(null);
    setInst((i) => ({ ...i, ...w }));
  };
  const wisselOnderwerp = (o: WerkbladOnderwerp) =>
    pas({ onderwerpen: inst.onderwerpen.includes(o) ? inst.onderwerpen.filter((x) => x !== o) : [...inst.onderwerpen, o] });
  const wisselTafel = (t: number) => pas({ tafels: inst.tafels.includes(t) ? inst.tafels.filter((x) => x !== t) : [...inst.tafels, t].sort((a, b) => a - b) });

  async function maak() {
    if (inst.onderwerpen.length === 0) return setFout("Kies eerst een onderwerp.");
    if (inst.onderwerpen.includes("tafels") && inst.tafels.length === 0) return setFout("Kies eerst een tafel.");
    setBezig(true);
    // Hetzelfde blad als het voorbeeld; daarna een nieuwe seed voor het volgende blad.
    const werkblad = maakWerkblad(inst);
    const { opslag } = await bewaarWerkblad(werkblad).catch(() => ({ opslag: "fout" as const }));
    if (opslag === "fout") {
      setBezig(false);
      return setFout("Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.");
    }
    bewaarLokaalWerkblad(werkblad);
    startNavigatie(() => {
      setBezig(false);
      router.push(`/werkbladen/${werkblad.id}`);
    });
  }

  return (
    <div className="mees-content flex flex-col gap-8 py-6 tablet:max-w-[1000px] tablet:py-10">
      <div>
        <TerugLink href="/kind/start">Start</TerugLink>
        <div className="mt-2 flex items-center justify-between gap-6">
          <div>
            <h1 className="titel-held">Maak een werkblad</h1>
            <p className="mt-2 subtitel font-semibold text-tekst-zacht">Kies wat je op papier wilt oefenen.</p>
          </div>
          <Mees pose="helpt" breedte={200} className="hidden w-44 tablet:block" />
        </div>
      </div>

      <fieldset>
        <StapKop nummer={1} id="vak">Kies een vak</StapKop>
        <div className="grid gap-3 tablet:grid-cols-2">
          <KeuzeKaart naam="vak" waarde="rekenen" gekozen onKies={() => {}} titel="Rekenen" icoon={<Icoon naam="rekenen" className="size-8" />} />
          <KeuzeKaart naam="vak" waarde="aardrijkskunde" gekozen={false} onKies={() => {}} uitgeschakeld titel="Aardrijkskunde" reden="Kaartwerkbladen komen later." icoon={<Icoon naam="aardrijkskunde" className="size-8" />} />
        </div>
      </fieldset>

      <fieldset>
        <StapKop nummer={2} id="onderwerpen">Kies onderwerpen</StapKop>
        <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4">
          {(["breuken", "tafels"] as const).map((o) => {
            const aan = inst.onderwerpen.includes(o);
            return (
              <label
                key={o}
                className={`flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border p-3 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus ${
                  aan ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-rand-interactief bg-wit hover:bg-blauw-zacht"
                }`}
              >
                <input type="checkbox" className="sr-only" checked={aan} onChange={() => wisselOnderwerp(o)} />
                <Icoon naam={o === "breuken" ? "breuken" : "tafels"} className="size-8 text-actie-blauw" />
                {o === "breuken" ? "Breuken" : "Tafels"}
              </label>
            );
          })}
          {["Kommagetallen", "Meten"].map((n) => (
            <div key={n} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-[16px] border border-rand-zacht bg-wit p-3 text-center text-tekst-zacht">
              <span className="font-bold">{n}</span>
              <span className="tekst-klein">Komt later</span>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <StapKop nummer={3} id="onderdelen">Kies onderdelen</StapKop>
        {inst.onderwerpen.length === 0 && <p className="text-tekst-zacht">Kies eerst een vak en onderwerp.</p>}
        <div className="flex flex-col gap-4">
          {inst.onderwerpen.includes("breuken") && (
            <div className="rounded-[16px] border border-rand-zacht bg-wit p-4">
              <p className="font-bold">Breuken</p>
              <label className="mt-2 flex min-h-12 items-center gap-3">
                <input type="checkbox" checked readOnly className="size-6 accent-actie-blauw" />
                <span>
                  Breuken vergelijken <span className="tekst-klein text-tekst-zacht">· groter, kleiner of gelijk</span>
                </span>
              </label>
              <p className="tekst-klein text-tekst-zacht">Andere breukonderdelen komen later.</p>
            </div>
          )}
          {inst.onderwerpen.includes("tafels") && (
            <div className="rounded-[16px] border border-rand-zacht bg-wit p-4">
              <p className="font-bold">Welke tafels?</p>
              <div className="mt-2 grid grid-cols-6 gap-2 tablet:grid-cols-12">
                {TAFELS.map((t) => {
                  const aan = inst.tafels.includes(t);
                  return (
                    <label key={t} className={`grid min-h-12 cursor-pointer place-items-center rounded-[10px] border text-lg font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${aan ? "border-actie-blauw bg-actie-blauw text-wit" : "border-rand-interactief bg-wit hover:bg-blauw-zacht"}`}>
                      <input type="checkbox" className="sr-only" checked={aan} onChange={() => wisselTafel(t)} aria-label={`Tafel van ${t}`} />
                      <span aria-hidden>{t}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                {([["x", "Keer"], [":", "Delen"]] as const).map(([b, naam]) => (
                  <label key={b} className="flex min-h-12 items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-6 accent-actie-blauw"
                      checked={inst.bewerkingen.includes(b)}
                      onChange={() => {
                        const nieuw = inst.bewerkingen.includes(b) ? inst.bewerkingen.filter((x) => x !== b) : [...inst.bewerkingen, b];
                        if (nieuw.length) pas({ bewerkingen: nieuw });
                      }}
                    />
                    {naam}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </fieldset>

      {inst.onderwerpen.includes("breuken") && (
        <fieldset>
          <StapKop nummer={4} id="niveau">Kies een niveau</StapKop>
          <div className="grid gap-3 tablet:grid-cols-3">
            {niveaus.map((n) => (
              <KeuzeKaart key={n.waarde} naam="niveau" waarde={n.waarde} gekozen={inst.niveau === n.waarde} onKies={() => pas({ niveau: n.waarde })} titel={n.titel} omschrijving={n.omschrijving} />
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <StapKop nummer={inst.onderwerpen.includes("breuken") ? 5 : 4} id="aantal">Hoeveel vragen?</StapKop>
        <div className="flex items-center justify-between gap-4 rounded-[16px] border border-rand-interactief bg-wit p-2 tablet:max-w-sm">
          <button type="button" onClick={() => pas({ aantal: Math.max(werkbladConfig.minAantal, inst.aantal - 1) })} disabled={inst.aantal <= werkbladConfig.minAantal} className="grid size-12 place-items-center rounded-full bg-blauw-zacht text-actie-blauw disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst" aria-label="Eén vraag minder">
            <Icoon naam="min" />
          </button>
          <output aria-live="polite" aria-labelledby="aantal" className="text-3xl font-extrabold tabular-nums">
            {inst.aantal}
          </output>
          <button type="button" onClick={() => pas({ aantal: Math.min(werkbladConfig.maxAantal, inst.aantal + 1) })} disabled={inst.aantal >= werkbladConfig.maxAantal} className="grid size-12 place-items-center rounded-full bg-actie-blauw text-wit disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst" aria-label="Eén vraag meer">
            <Icoon naam="plus" />
          </button>
        </div>
      </fieldset>

      {fout && <Melding soort="fout">{fout}</Melding>}

      <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
        <PrimaireKnop groot onClick={maak} disabled={bezig || vragen.length === 0} className="w-full tablet:w-auto">
          {bezig ? "Even wachten…" : "Maak werkblad"}
          {!bezig && <Icoon naam="pijl-rechts" />}
        </PrimaireKnop>
        <button
          type="button"
          onClick={() => pas({ seed: nieuweSeed() })}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht"
        >
          Andere vragen
        </button>
      </div>

      {/* Voorbeeld onder de instellingen (nooit ernaast); precies het blad dat je krijgt. */}
      <section aria-labelledby="voorbeeld-titel" className="border-t border-rand-zacht pt-6">
        <button type="button" onClick={() => setVoorbeeldOpen((o) => !o)} aria-expanded={voorbeeldOpen} className="flex min-h-12 w-full items-center justify-between gap-3 text-left">
          <span>
            <span id="voorbeeld-titel" className="block subtitel">
              Voorbeeld van je werkblad
            </span>
            <span className="block tekst-klein text-tekst-zacht">{vragen.length ? `${werkbladTitel(inst)} · ${vragen.length} vragen` : "Kies eerst een onderwerp."}</span>
          </span>
          <Icoon naam="chevron-omlaag" className={`size-6 text-actie-blauw transition-transform ${voorbeeldOpen ? "rotate-180" : ""}`} />
        </button>
        {voorbeeldOpen && vragen.length > 0 && (
          <div className="mt-4">
            <WerkbladBlad werkblad={{ code: "Voorbeeld", titel: werkbladTitel(inst), vragen: vragen.map((vraagId) => ({ vraagId, versie: 1 })) }} />
          </div>
        )}
      </section>
    </div>
  );
}
