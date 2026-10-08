"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { KeuzeKaart, StapKop } from "@/components/mees/KeuzeKaart";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { useProfiel } from "@/components/mees/Profiel";
import { gastLimietBereikt, maakTafelSessie, oefenConfig, tijdKeuzes } from "@/features/oefenen/sessie";
import { TAFELS } from "@/features/oefenen/tafel-vragen";
import { haalOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";

type Bewerking = "x" | ":" | "beide";

export function TafelInstellen() {
  const router = useRouter();
  const params = useSearchParams();
  const { kind } = useProfiel();
  const voorkeur = [params.get("tafel"), ...(params.get("tafels")?.split(",") ?? [])]
    .map(Number)
    .filter((t) => TAFELS.includes(t as (typeof TAFELS)[number]));
  const [tafels, setTafels] = useState<number[]>([...new Set(voorkeur)].sort((a, b) => a - b));
  const [bewerking, setBewerking] = useState<Bewerking>("x");
  const [metTijd, setMetTijd] = useState(false);
  const [seconden, setSeconden] = useState<number>(tijdKeuzes[1].seconden);
  const [aantal, setAantal] = useState<number>(oefenConfig.standaardAantal);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  function wissel(t: number) {
    setFout(null);
    setTafels((huidig) => (huidig.includes(t) ? huidig.filter((x) => x !== t) : [...huidig, t].sort((a, b) => a - b)));
  }

  function start() {
    if (tafels.length === 0) {
      setFout("Kies eerst een tafel.");
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
        const r = maakTafelSessie(data, {
          tafels,
          bewerkingen: bewerking === "beide" ? ["x", ":"] : [bewerking],
          aantal,
          metTijd,
          secondenPerVraag: seconden,
          bron: "zelf",
        });
        sessieId = r.sessie.id;
        return r.data;
      });
    } catch {
      setFout("Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.");
      setBezig(false);
      return;
    }
    router.push(`/kind/tafeltrainer/${sessieId}`);
  }

  const samenvatting = tafels.length === 0 ? "Nog geen tafel gekozen" : `Tafel${tafels.length > 1 ? "s" : ""} van ${tafels.join(", ")} · ${aantal} vragen${metTijd ? ` · ${seconden} sec per vraag` : ""}`;

  return (
    <div className="mees-content flex flex-col py-6 tablet:max-w-[1000px] tablet:py-8 desktop:py-10">
      <TerugLink href="/kind/rekenen">Rekenen</TerugLink>
      <div className="mt-2 flex items-center justify-between gap-6">
        <div>
          <h1 className="titel-held">Tafeltrainer</h1>
          <p className="mt-2 subtitel font-semibold text-tekst-zacht">Welke tafels wil je oefenen?</p>
        </div>
        <Mees pose="zwaait" breedte={160} className="hidden w-32 tablet:block desktop:w-40" />
      </div>

      <form
        className="mt-6 flex flex-col gap-8 tablet:mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <fieldset aria-describedby="tafels-uitleg">
          <StapKop nummer={1} id="tafels">Welke tafels?</StapKop>
          <div className="grid grid-cols-4 gap-2 min-[480px]:grid-cols-6 tablet:gap-3">
            {TAFELS.map((t) => {
              const aan = tafels.includes(t);
              return (
                <label
                  key={t}
                  className={`grid min-h-14 cursor-pointer place-items-center rounded-[12px] border text-2xl font-bold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus tablet:min-h-16 ${
                    aan ? "border-actie-blauw bg-actie-blauw text-wit" : "border-rand-interactief bg-wit hover:bg-blauw-zacht"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={aan} onChange={() => wissel(t)} aria-label={`Tafel van ${t}`} />
                  <span aria-hidden>{t}</span>
                </label>
              );
            })}
          </div>
          <p id="tafels-uitleg" className="mt-2 tekst-klein text-tekst-zacht">
            Kies één of meer tafels.
          </p>
        </fieldset>

        <fieldset>
          <StapKop nummer={2} id="bewerking">Wat wil je oefenen?</StapKop>
          <div className="grid gap-3 tablet:grid-cols-3 tablet:gap-4">
            <KeuzeKaart naam="bewerking" waarde="x" gekozen={bewerking === "x"} onKies={() => setBewerking("x")} titel="Keer" omschrijving="Bijvoorbeeld 6 × 7" />
            <KeuzeKaart naam="bewerking" waarde=":" gekozen={bewerking === ":"} onKies={() => setBewerking(":")} titel="Delen" omschrijving="Bijvoorbeeld 42 : 7" />
            <KeuzeKaart naam="bewerking" waarde="beide" gekozen={bewerking === "beide"} onKies={() => setBewerking("beide")} titel="Allebei" omschrijving="Keer en delen door elkaar" />
          </div>
        </fieldset>

        <fieldset>
          <StapKop nummer={3} id="tempo">Hoe wil je oefenen?</StapKop>
          <div className="grid gap-3 min-[480px]:grid-cols-2 tablet:gap-4">
            <KeuzeKaart
              naam="tempo"
              waarde="rustig"
              gekozen={!metTijd}
              onKies={() => setMetTijd(false)}
              titel="Rustig oefenen"
              omschrijving="Zonder tijd."
              icoon={<Icoon naam="scherm" className="size-8" />}
            />
            <KeuzeKaart
              naam="tempo"
              waarde="tijd"
              gekozen={metTijd}
              onKies={() => setMetTijd(true)}
              titel="Met tijd"
              omschrijving="Per vraag loopt een tijd af."
              icoon={<Icoon naam="tijd" className="size-8" />}
            />
          </div>
          {metTijd && (
            <fieldset className="mt-4">
              <legend className="mb-2 font-bold">Hoeveel tijd per vraag?</legend>
              <div className="grid gap-3 min-[480px]:grid-cols-3">
                {tijdKeuzes.map((k) => (
                  <KeuzeKaart key={k.seconden} naam="seconden" waarde={String(k.seconden)} gekozen={seconden === k.seconden} onKies={() => setSeconden(k.seconden)} titel={k.titel} omschrijving={k.omschrijving} />
                ))}
              </div>
            </fieldset>
          )}
          <p className="mt-2 tekst-klein text-tekst-zacht">Met tijd oefenen is niet verplicht. Is de tijd om, dan mag je het antwoord nog invullen.</p>
        </fieldset>

        <fieldset>
          <StapKop nummer={4} id="aantal">Hoeveel vragen?</StapKop>
          <div className="flex items-center justify-between gap-4 rounded-[16px] border border-rand-interactief bg-wit p-2 tablet:max-w-sm">
            <button
              type="button"
              onClick={() => setAantal((a) => Math.max(oefenConfig.minAantal, a - 1))}
              disabled={aantal <= oefenConfig.minAantal}
              className="grid size-12 place-items-center rounded-full bg-blauw-zacht text-actie-blauw disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst"
              aria-label="Eén vraag minder"
            >
              <Icoon naam="min" />
            </button>
            <output aria-live="polite" aria-labelledby="aantal" className="text-3xl font-extrabold tabular-nums">
              {aantal}
            </output>
            <button
              type="button"
              onClick={() => setAantal((a) => Math.min(oefenConfig.maxAantal, a + 1))}
              disabled={aantal >= oefenConfig.maxAantal}
              className="grid size-12 place-items-center rounded-full bg-actie-blauw text-wit disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst"
              aria-label="Eén vraag meer"
            >
              <Icoon naam="plus" />
            </button>
          </div>
          <p className="mt-2 tekst-klein text-tekst-zacht">Je kunt altijd stoppen.</p>
        </fieldset>

        {fout && <Melding soort="fout">{fout}</Melding>}

        <div className="flex flex-col items-stretch gap-3 tablet:flex-row tablet:items-center tablet:gap-5">
          <PrimaireKnop type="submit" groot disabled={bezig} className="w-full tablet:w-auto">
            {bezig ? "Even wachten…" : "Start oefenen"}
            {!bezig && <Icoon naam="pijl-rechts" />}
          </PrimaireKnop>
          <p className="text-center text-tekst-zacht tablet:border-l tablet:border-rand-zacht tablet:pl-5 tablet:text-left">{samenvatting}</p>
        </div>
        <Link
          href={`/werkbladen/samenstellen?onderwerpen=tafels&tafels=${tafels.join(",")}&bewerkingen=${bewerking === "beide" ? "x,:" : bewerking}&aantal=${Math.min(20, Math.max(4, aantal))}`}
          className="inline-flex min-h-12 items-center justify-center gap-2 self-center rounded-[12px] px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht tablet:self-start"
        >
          <Icoon naam="printer" />
          Liever op papier? Maak een werkblad
        </Link>
      </form>
    </div>
  );
}
