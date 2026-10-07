"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Breuk, TekstMetBreuken } from "@/components/mees/Breuk";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop, ZachteKnop } from "@/components/mees/Knoppen";
import { LeesoptiesKnop } from "@/components/mees/Leesopties";
import { VoorleesKnop } from "@/components/mees/Voorlezen";
import { vindOnderdeel } from "@/content/onderwerpen";
import { gaVerder, oefenConfig, registreerAntwoord, rondOvergangAf, vraagHulp } from "@/features/oefenen/sessie";
import type { Sessie, Slot } from "@/features/oefenen/types";
import { vindVraag, type Vraag } from "@/features/oefenen/vragen";
import { haalOpslag, useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";

const teksten = {
  goed: "Goed gevonden!",
  goedMetHulp: "Goed gevonden. Je hebt de aanwijzing gebruikt.",
  eersteFout: "Dit is nog niet goed. Kijk nog eens naar de vraag.",
  hintEen: "Probeer het met deze aanwijzing.",
  hintTwee: "Hier is nog een aanwijzing.",
  uitleg: "Lees de uitleg rustig. Daarna kun je verder.",
  opslaanMislukt: "Bewaren lukt nu niet. Sluit dit scherm nog niet.",
};

type Feedback = { soort: "goed" | "fout"; tekst: string } | null;

export function OefenScherm({ sessieId }: { sessieId: string }) {
  const router = useRouter();
  const opslag = useOpslag();
  const sessie = opslag?.sessies[sessieId];

  // Bij openen: een onderbroken overgang na een goed antwoord afronden (hervat bij de volgende vraag).
  useEffect(() => {
    if (sessie?.status === "bezig" && sessie.slots[sessie.index]?.uitkomst) {
      wijzigOpslag((d) => rondOvergangAf(d, sessieId));
    }
    // Alleen bij openen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessie?.status === "afgerond") router.replace(`/kind/oefening/${sessieId}/afgerond`);
  }, [sessie?.status, sessieId, router]);

  if (opslag === null) return <Laden />;

  if (!sessie) {
    return (
      <div className="mees-content py-10">
        <h1 className="titel-pagina">Oefenen</h1>
        <Melding className="mt-6">
          Er is geen oefening geopend. Kies eerst een onderwerp.{" "}
          <Link href="/kind/rekenen" className="font-bold text-actie-blauw underline underline-offset-4">
            Naar rekenen
          </Link>
        </Melding>
      </div>
    );
  }

  const slot = sessie.slots[sessie.index];
  const vraag = slot ? vindVraag(slot.vraagId) : null;
  if (sessie.status === "afgerond" || !slot || !vraag) return <Laden />;

  return <Vraagplaats key={slot.id} sessie={sessie} slot={slot} vraag={vraag} rustigVerder={opslag.instellingen.rustigVerder} />;
}

function Vraagplaats({ sessie, slot, vraag, rustigVerder }: { sessie: Sessie; slot: Slot; vraag: Vraag; rustigVerder: boolean }) {
  const router = useRouter();
  const [gekozen, setGekozen] = useState<string | null>(slot.hulp.fouten > 0 ? (slot.antwoord ?? null) : null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [bewaarFout, setBewaarFout] = useState(false);
  const titelRef = useRef<HTMLHeadingElement>(null);
  const overgang = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onderdeel = vindOnderdeel(sessie.onderdeelId);
  const nummer = sessie.index + 1;
  const klaar = Boolean(slot.uitkomst);
  const uitlegZichtbaar = slot.hulp.uitleg;
  const vergrendeld = klaar || uitlegZichtbaar;

  // Nieuwe vraag: focus op de vraag, zodat toetsenbord en schermlezer meteen goed staan.
  useEffect(() => {
    if (sessie.index > 0) titelRef.current?.focus();
    return () => {
      if (overgang.current) clearTimeout(overgang.current);
    };
  }, [sessie.index]);

  function bewaar(wijziging: Parameters<typeof wijzigOpslag>[0]) {
    const gelukt = wijzigOpslag(wijziging);
    setBewaarFout(!gelukt);
  }

  function volgende() {
    if (overgang.current) clearTimeout(overgang.current);
    bewaar((d) => gaVerder(d, sessie.id));
    const na = haalOpslag().sessies[sessie.id];
    if (na?.status === "afgerond") router.push(`/kind/oefening/${sessie.id}/afgerond`);
  }

  function controleer() {
    if (!gekozen || vergrendeld) return;
    let beoordeling: "goed" | "fout" | null = null;
    bewaar((d) => {
      const r = registreerAntwoord(d, sessie.id, gekozen);
      if (!r) return d;
      beoordeling = r.beoordeling;
      return r.data;
    });
    const nieuwSlot = haalOpslag().sessies[sessie.id]?.slots[sessie.index];
    if (beoordeling === "goed") {
      setFeedback({ soort: "goed", tekst: nieuwSlot?.uitkomst === "zelfstandig" ? teksten.goed : teksten.goedMetHulp });
      if (!rustigVerder) overgang.current = setTimeout(volgende, oefenConfig.correctOvergangMs);
    } else if (beoordeling === "fout" && nieuwSlot) {
      const f = nieuwSlot.hulp.fouten;
      setFeedback({
        soort: "fout",
        tekst: f >= 4 ? teksten.uitleg : f === 3 ? teksten.hintTwee : f === 2 ? teksten.hintEen : teksten.eersteFout,
      });
    }
  }

  function stop() {
    if (overgang.current) clearTimeout(overgang.current);
    bewaar((d) => rondOvergangAf(d, sessie.id));
    const na = haalOpslag().sessies[sessie.id];
    router.push(na?.status === "afgerond" ? `/kind/oefening/${sessie.id}/afgerond` : "/kind/start");
  }

  const hulpLabel = slot.hulp.hints === 0 ? "Bekijk een hint" : slot.hulp.hints === 1 ? "Bekijk hint 2" : "Bekijk de uitleg";
  const hulpKort = slot.hulp.hints === 0 ? "Hint" : slot.hulp.hints === 1 ? "Hint 2" : "Uitleg";
  const hulpUitleg =
    slot.hulp.hints === 0 ? "Je kunt twee hints bekijken." : slot.hulp.hints === 1 ? "Hint 1 is bekeken." : "Beide hints zijn bekeken.";

  const [l1, l2] = vraag.visual.links;
  const [r1, r2] = vraag.visual.rechts;
  const voorleesTekst = `${vraag.prompt} ${l1}/${l2} en ${r1}/${r2}. ${vraag.instructie}`;
  const afgehandeld = sessie.slots.filter((s) => s.uitkomst).length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mees-content flex flex-1 flex-col pt-4 tablet:max-w-[1100px] tablet:pt-6 desktop:pt-8">
        {/* Kop: terug, voortgang, stoppen */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 tablet:grid-cols-[auto_1fr_auto] tablet:gap-x-8">
          <Link
            href={`/kind/oefening/instellen?onderdeel=${sessie.onderdeelId}`}
            className="-ml-2 inline-flex min-h-12 min-w-0 items-center gap-2 rounded-[12px] px-2 text-[1.0625rem] font-bold text-actie-blauw hover:bg-blauw-zacht col-start-1 row-start-1 tablet:text-lg"
            onClick={() => {
              if (overgang.current) clearTimeout(overgang.current);
              wijzigOpslag((d) => rondOvergangAf(d, sessie.id));
            }}
          >
            <Icoon naam="pijl-links" className="size-6" />
            <span className="truncate tablet:hidden">{onderdeel?.onderwerp.naam ?? "Terug"}</span>
            <span className="hidden truncate tablet:inline">{onderdeel?.onderdeel.naam ?? "Terug"}</span>
          </Link>
          <div className="col-span-2 row-start-2 tablet:col-span-1 tablet:col-start-2 tablet:row-start-1">
            <VoortgangBalk nummer={nummer} aantal={sessie.slots.length} afgehandeld={afgehandeld} />
          </div>
          <ZachteKnop onClick={stop} className="col-start-2 row-start-1 justify-self-end tablet:col-start-3">
            Stop voor nu
          </ZachteKnop>
        </div>

        {/* Vraag */}
        <section aria-labelledby="vraag-titel" className="flex flex-1 flex-col items-center py-6 text-center tablet:py-8">
          <h1 id="vraag-titel" ref={titelRef} tabIndex={-1} className="titel-oefening outline-none desktop:text-[2.5rem]">
            {vraag.prompt}
          </h1>
          <p className="mt-1 tekst-intro text-[#5b6fae]">{vraag.instructie}</p>

          <div className="som mt-6 flex items-center justify-center gap-6 text-inkt tablet:mt-8 tablet:gap-12" role="group" aria-label={`Breuk ${l1}/${l2} en breuk ${r1}/${r2}`}>
            <Breuk teller={l1} noemer={l2} />
            <span
              className={`grid size-20 place-items-center rounded-[12px] border-2 text-[0.8em] tablet:size-24 ${
                gekozen ? "border-actie-blauw bg-blauw-zacht text-inkt" : "border-rand-interactief text-[#6c7fbf]"
              }`}
              aria-hidden
            >
              {gekozen ?? "?"}
            </span>
            <Breuk teller={r1} noemer={r2} />
          </div>

          <fieldset className="mt-6 w-full tablet:mt-8" disabled={vergrendeld}>
            <legend className="sr-only">{vraag.instructie}</legend>
            <div className="mx-auto grid max-w-sm grid-cols-3 gap-3 tablet:max-w-md tablet:gap-5">
              {vraag.options.map((optie) => {
                const isGekozen = gekozen === optie;
                const label = optie === "<" ? "kleiner dan" : optie === ">" ? "groter dan" : "is gelijk aan";
                return (
                  <label
                    key={optie}
                    className={`grid aspect-square min-h-16 cursor-pointer place-items-center rounded-[16px] border text-5xl font-bold transition-colors duration-[120ms] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus tablet:text-6xl ${
                      isGekozen
                        ? "border-2 border-actie-blauw bg-blauw-zacht"
                        : "border-rand-interactief bg-[#f5faff] [@media(hover:hover)]:hover:bg-blauw-zacht"
                    } ${vergrendeld ? "cursor-default opacity-100" : ""}`}
                  >
                    <input
                      type="radio"
                      name="antwoord"
                      value={optie}
                      checked={isGekozen}
                      onChange={() => {
                        setGekozen(optie);
                        if (feedback?.soort === "fout") setFeedback(null);
                      }}
                      className="sr-only"
                      aria-label={label}
                    />
                    <span aria-hidden>{optie}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Feedback en hulp: vóór de bediening, zonder sprong naar boven */}
          <div className="mt-6 w-full max-w-[1000px] text-left" aria-live="polite">
            {feedback && !(feedback.soort === "fout" && slot.hulp.hints > 0) && (
              <Melding soort={feedback.soort === "goed" ? "succes" : "probeer-opnieuw"} className="mees-verschijn mx-auto max-w-xl font-bold">
                {feedback.tekst}
              </Melding>
            )}
          </div>
          <HulpPaneel key={slot.hulp.uitleg ? 3 : slot.hulp.hints} slot={slot} vraag={vraag} feedbackTekst={feedback?.soort === "fout" ? feedback.tekst : null} />
          {bewaarFout && (
            <Melding soort="fout" className="mt-4 w-full max-w-[1000px] text-left">
              {teksten.opslaanMislukt}
            </Melding>
          )}
        </section>
      </div>

      {/* OefenBediening: vaste plek onderaan, op korte schermen sticky */}
      <div className="sticky bottom-0 z-20 border-t border-rand-zacht bg-wit/95 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur tablet:pb-6 tablet:pt-5">
        <div className="mees-content tablet:max-w-[1100px]">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 tablet:grid-cols-[auto_1fr_auto] tablet:items-start tablet:gap-6">
            <div className="flex min-w-0 flex-col gap-1">
              <SecundaireKnop
                onClick={() => bewaar((d) => vraagHulp(d, sessie.id))}
                disabled={vergrendeld}
                className="w-full border-actie-blauw px-3 tablet:w-auto desktop:min-w-56"
              >
                <Icoon naam="hint" className="size-6" />
                <span className="min-[360px]:hidden" aria-hidden>{hulpKort}</span>
                <span className="max-[359px]:sr-only">{hulpLabel}</span>
              </SecundaireKnop>
              <p className="hidden pl-2 tekst-klein text-tekst-zacht desktop:block">{hulpUitleg}</p>
            </div>
            <div className="col-span-2 flex gap-2 tablet:col-span-1 tablet:justify-center tablet:gap-3">
              <VoorleesKnop tekst={voorleesTekst} compact />
              <LeesoptiesKnop compact />
            </div>
            <div className="col-span-3 tablet:col-span-1">
            {klaar ? (
              <PrimaireKnop groot onClick={volgende} className="w-full tablet:w-auto desktop:min-w-64">
                {nummer === sessie.slots.length ? "Afronden" : "Volgende vraag"}
                <Icoon naam="pijl-rechts" />
              </PrimaireKnop>
            ) : uitlegZichtbaar ? (
              <PrimaireKnop groot onClick={volgende} className="w-full tablet:w-auto desktop:min-w-64">
                Verder
                <Icoon naam="pijl-rechts" />
              </PrimaireKnop>
            ) : (
              <div className="flex flex-col gap-1">
                <PrimaireKnop groot onClick={controleer} disabled={!gekozen} className="w-full tablet:w-auto desktop:min-w-64">
                  Controleer antwoord
                </PrimaireKnop>
                {!gekozen && <p className="hidden tekst-klein text-tekst-zacht desktop:block desktop:text-right">Kies eerst een teken.</p>}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoortgangBalk({ nummer, aantal, afgehandeld }: { nummer: number; aantal: number; afgehandeld: number }) {
  return (
    <div>
      <p className="text-base font-bold" id="voortgang-label">
        Vraag {nummer} van {aantal}
      </p>
      <div
        role="progressbar"
        aria-labelledby="voortgang-label"
        aria-valuemin={0}
        aria-valuemax={aantal}
        aria-valuenow={afgehandeld}
        className="mt-2 flex gap-1"
      >
        {Array.from({ length: aantal }, (_, i) => (
          <span
            key={i}
            className={`h-2.5 flex-1 rounded-full transition-colors duration-200 ${
              i < afgehandeld ? "bg-merk-blauw" : i === nummer - 1 ? "bg-[#9fcdfb]" : "bg-blauw-zacht"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** HulpPaneel: hint 1, hint 2 of uitleg op dezelfde pagina (S06). */
function HulpPaneel({ slot, vraag, feedbackTekst }: { slot: Slot; vraag: Vraag; feedbackTekst: string | null }) {
  const [verborgen, setVerborgen] = useState(false);
  const paneel = useRef<HTMLDivElement>(null);
  const { hints, uitleg } = slot.hulp;
  const niveau = uitleg ? 3 : hints;

  // Nieuwe hulp zachtjes in beeld brengen boven de vaste bedieningsbalk; geen sprong naar boven.
  useEffect(() => {
    const rustig = document.documentElement.dataset.rustigeOvergangen === "true" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    paneel.current?.scrollIntoView({ block: "nearest", behavior: rustig ? "auto" : "smooth" });
  }, []);

  if (niveau === 0) return null;
  if (verborgen) {
    return (
      <button
        type="button"
        onClick={() => setVerborgen(false)}
        className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 font-bold text-actie-blauw hover:bg-blauw-zacht"
      >
        <Icoon naam="hint" className="size-6" />
        Toon hint {hints} weer
      </button>
    );
  }

  return (
    <div ref={paneel} className="mees-verschijn mt-2 w-full max-w-[1000px] scroll-mb-40 rounded-[16px] bg-blauw-zacht p-4 text-left tablet:p-6">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 text-actie-blauw" aria-hidden>
          <Icoon naam="hint" className="size-8" />
        </span>
        <div className="min-w-0 flex-1">
          {feedbackTekst && <p className="mb-2 font-bold text-probeer-opnieuw">{feedbackTekst}</p>}
          {uitleg ? (
            <>
              <h2 className="font-bold text-actie-blauw">Uitleg</h2>
              <p className="mt-1 text-lg">
                <TekstMetBreuken tekst={vraag.explanation} />
              </p>
              <p className="mt-3 font-bold">
                Het goede antwoord is <span className="text-2xl">{vraag.answer}</span> ({vraag.antwoordInWoorden}).
              </p>
            </>
          ) : (
            <>
              <h2 className="font-bold text-actie-blauw">Hint {hints} van 2</h2>
              <p className="mt-1 text-lg">
                <TekstMetBreuken tekst={vraag.hints[hints - 1]} />
              </p>
              {hints === 2 && (
                <p className="mt-3 tekst-klein text-tekst-zacht">
                  Hint 1: <TekstMetBreuken tekst={vraag.hints[0]} />
                </p>
              )}
            </>
          )}
        </div>
        {!uitleg && (
          <button
            type="button"
            onClick={() => setVerborgen(true)}
            className="-m-2 grid size-12 shrink-0 place-items-center rounded-full hover:bg-wit"
            aria-label="Hint verbergen"
          >
            <Icoon naam="sluiten" />
          </button>
        )}
      </div>
    </div>
  );
}
