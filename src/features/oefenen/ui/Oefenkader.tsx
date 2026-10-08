"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { TekstMetBreuken } from "@/components/mees/Breuk";
import { Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop, ZachteKnop } from "@/components/mees/Knoppen";
import { LeesoptiesKnop } from "@/components/mees/Leesopties";
import { VoorleesKnop } from "@/components/mees/Voorlezen";
import { gaVerder, oefenConfig, registreerAntwoord, rondOvergangAf, sessieRoute, vraagHulp } from "../sessie";
import type { Sessie, Slot } from "../types";
import { goedAntwoordTekst, type Vraag } from "../vragen";
import { haalOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";

// Gedeelde onderdelen van elk oefenscherm: logica van één vraagplaats, kop, hulp en bedieningsbalk.

export const oefenTeksten = {
  goed: "Goed gevonden!",
  goedMetHulp: "Goed gevonden. Je hebt de aanwijzing gebruikt.",
  eersteFout: "Dit is nog niet goed. Kijk nog eens naar de vraag.",
  hintEen: "Probeer het met deze aanwijzing.",
  hintTwee: "Hier is nog een aanwijzing.",
  uitleg: "Lees de uitleg rustig. Daarna kun je verder.",
  opslaanMislukt: "Bewaren lukt nu niet. Sluit dit scherm nog niet.",
};

export type Feedback = { soort: "goed" | "fout"; tekst: string } | null;

/** Logica van één vraagplaats: antwoord kiezen, controleren, hulpladder, automatische overgang, stoppen. */
export function useVraagplaats({
  sessie,
  slot,
  rustigVerder,
  actieveDuur,
}: {
  sessie: Sessie;
  slot: Slot;
  rustigVerder: boolean;
  /** Geeft de actieve antwoordtijd (tafeltrainer). */
  actieveDuur?: () => number;
}) {
  const router = useRouter();
  const [gekozen, setGekozen] = useState<string | null>(slot.hulp.fouten > 0 ? (slot.antwoord ?? null) : null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [bewaarFout, setBewaarFout] = useState(false);
  const titelRef = useRef<HTMLHeadingElement>(null);
  const overgang = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setBewaarFout(!wijzigOpslag(wijziging));
  }

  function naarVolgendeOfKlaar() {
    const na = haalOpslag().sessies[sessie.id];
    if (na?.status === "afgerond") router.push(sessieRoute(na));
  }

  function volgende() {
    if (overgang.current) clearTimeout(overgang.current);
    bewaar((d) => gaVerder(d, sessie.id));
    naarVolgendeOfKlaar();
  }

  function kies(waarde: string | null) {
    setGekozen(waarde);
    if (feedback?.soort === "fout") setFeedback(null);
  }

  function controleer(antwoord = gekozen) {
    if (!antwoord || vergrendeld) return;
    let beoordeling: "goed" | "fout" | null = null;
    bewaar((d) => {
      const r = registreerAntwoord(d, sessie.id, antwoord, { actieveDuurMs: actieveDuur?.() });
      if (!r) return d;
      beoordeling = r.beoordeling;
      return r.data;
    });
    const nieuwSlot = haalOpslag().sessies[sessie.id]?.slots[sessie.index];
    if (beoordeling === "goed") {
      setFeedback({ soort: "goed", tekst: nieuwSlot?.uitkomst === "zelfstandig" ? oefenTeksten.goed : oefenTeksten.goedMetHulp });
      if (!rustigVerder) overgang.current = setTimeout(volgende, oefenConfig.correctOvergangMs);
    } else if (beoordeling === "fout" && nieuwSlot) {
      const f = nieuwSlot.hulp.fouten;
      setFeedback({
        soort: "fout",
        tekst: f >= 4 ? oefenTeksten.uitleg : f === 3 ? oefenTeksten.hintTwee : f === 2 ? oefenTeksten.hintEen : oefenTeksten.eersteFout,
      });
    }
  }

  function hulp() {
    bewaar((d) => vraagHulp(d, sessie.id));
  }

  function stopOvergang() {
    if (overgang.current) clearTimeout(overgang.current);
    wijzigOpslag((d) => rondOvergangAf(d, sessie.id));
  }

  function stop() {
    stopOvergang();
    const na = haalOpslag().sessies[sessie.id];
    router.push(na?.status === "afgerond" ? sessieRoute(na) : "/kind/start");
  }

  return { gekozen, kies, feedback, bewaarFout, titelRef, klaar, uitlegZichtbaar, vergrendeld, controleer, volgende, hulp, stop, stopOvergang };
}

/** Kop van een oefenscherm: terug, voortgang en stoppen. */
export function OefenKop({
  terug,
  voortgang,
  onStop,
  onTerug,
  rechts,
}: {
  terug: { href: string; kort: string; lang: string };
  voortgang: { label: string; aantal: number; afgehandeld: number; huidige?: number };
  onStop: () => void;
  onTerug?: () => void;
  rechts?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 tablet:grid-cols-[auto_1fr_auto] tablet:gap-x-8">
      <Link
        href={terug.href}
        onClick={onTerug}
        className="col-start-1 row-start-1 -ml-2 inline-flex min-h-12 min-w-0 items-center gap-2 rounded-[12px] px-2 text-[1.0625rem] font-bold text-actie-blauw hover:bg-blauw-zacht tablet:text-lg"
      >
        <Icoon naam="pijl-links" className="size-6" />
        <span className="truncate tablet:hidden">{terug.kort}</span>
        <span className="hidden truncate tablet:inline">{terug.lang}</span>
      </Link>
      <div className="col-span-2 row-start-2 tablet:col-span-1 tablet:col-start-2 tablet:row-start-1">
        <VoortgangBalk {...voortgang} />
      </div>
      <div className="col-start-2 row-start-1 flex items-center gap-2 justify-self-end tablet:col-start-3">
        {rechts}
        <ZachteKnop onClick={onStop}>Stop voor nu</ZachteKnop>
      </div>
    </div>
  );
}

/** VoortgangBalk: segmenten tot 20, daarna één doorlopende balk. */
export function VoortgangBalk({ label, aantal, afgehandeld, huidige }: { label: string; aantal: number; afgehandeld: number; huidige?: number }) {
  return (
    <div>
      <p className="text-base font-bold" id="voortgang-label">
        {label}
      </p>
      <div role="progressbar" aria-labelledby="voortgang-label" aria-valuemin={0} aria-valuemax={aantal} aria-valuenow={afgehandeld} className="mt-2 flex gap-1">
        {aantal <= 20 ? (
          Array.from({ length: aantal }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full transition-colors duration-200 ${
                i < afgehandeld ? "bg-merk-blauw" : i === huidige ? "bg-[#9fcdfb]" : "bg-blauw-zacht"
              }`}
            />
          ))
        ) : (
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-blauw-zacht">
            <span className="block h-full rounded-full bg-merk-blauw transition-[width] duration-200" style={{ width: `${(afgehandeld / aantal) * 100}%` }} />
          </span>
        )}
      </div>
    </div>
  );
}

export function VraagTitel({
  titelRef,
  vraag,
  instructie,
  klein = false,
}: {
  titelRef: RefObject<HTMLHeadingElement | null>;
  vraag: string;
  instructie: string;
  /** Compacte variant, bijvoorbeeld onderaan in de kaart. */
  klein?: boolean;
}) {
  return (
    <>
      <h1 id="vraag-titel" ref={titelRef} tabIndex={-1} className={`outline-none ${klein ? "subtitel tablet:text-[1.75rem] tablet:font-extrabold" : "titel-oefening desktop:text-[2.5rem]"}`}>
        {vraag}
      </h1>
      <p className={`mt-1 text-[#5b6fae] ${klein ? "tekst-klein max-tablet:sr-only" : "tekst-intro"}`}>{instructie}</p>
    </>
  );
}

export function FeedbackEnHulp({ feedback, slot, vraag, bewaarFout }: { feedback: Feedback; slot: Slot; vraag: Vraag; bewaarFout: boolean }) {
  const meldingRef = useRef<HTMLDivElement>(null);
  // Feedback zachtjes in beeld brengen boven de vaste bedieningsbalk (bijv. onder een grote kaart).
  useEffect(() => {
    if (!feedback) return;
    const rustig = document.documentElement.dataset.rustigeOvergangen === "true" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    meldingRef.current?.scrollIntoView({ block: "nearest", behavior: rustig ? "auto" : "smooth" });
  }, [feedback]);
  return (
    <>
      <div ref={meldingRef} className="mt-6 w-full max-w-[1000px] scroll-mb-40 text-left" aria-live="polite">
        {feedback && !(feedback.soort === "fout" && slot.hulp.hints > 0) && (
          <Melding soort={feedback.soort === "goed" ? "succes" : "probeer-opnieuw"} className="mees-verschijn mx-auto max-w-xl font-bold">
            {feedback.tekst}
          </Melding>
        )}
      </div>
      <HulpPaneel key={slot.hulp.uitleg ? 3 : slot.hulp.hints} slot={slot} vraag={vraag} feedbackTekst={feedback?.soort === "fout" ? feedback.tekst : null} />
      {bewaarFout && (
        <Melding soort="fout" className="mt-4 w-full max-w-[1000px] text-left">
          {oefenTeksten.opslaanMislukt}
        </Melding>
      )}
    </>
  );
}

/** HulpPaneel: hint 1, hint 2 of uitleg op dezelfde pagina (S06). */
export function HulpPaneel({ slot, vraag, feedbackTekst }: { slot: Slot; vraag: Vraag; feedbackTekst: string | null }) {
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
                Het goede antwoord is <span className="text-xl">{goedAntwoordTekst(vraag)}</span>.
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
          <button type="button" onClick={() => setVerborgen(true)} className="-m-2 grid size-12 shrink-0 place-items-center rounded-full hover:bg-wit" aria-label="Hint verbergen">
            <Icoon naam="sluiten" />
          </button>
        )}
      </div>
    </div>
  );
}

/** OefenBediening: vaste plek onderaan, sticky. */
export function OefenBediening({
  slot,
  vergrendeld,
  klaar,
  uitlegZichtbaar,
  laatste,
  kanControleren,
  kiesEerst,
  voorleesTekst,
  onHulp,
  onControleer,
  onVolgende,
  controleerLabel = "Controleer antwoord",
  hulpUit,
}: {
  slot: Slot;
  vergrendeld: boolean;
  klaar: boolean;
  uitlegZichtbaar: boolean;
  laatste: boolean;
  kanControleren: boolean;
  kiesEerst: string;
  voorleesTekst: string;
  onHulp: () => void;
  onControleer: () => void;
  onVolgende: () => void;
  controleerLabel?: string;
  /** Hulpknop verbergen (bijv. als er geen stukje geselecteerd is). */
  hulpUit?: string;
}) {
  const hulpLabel = slot.hulp.hints === 0 ? "Bekijk een hint" : slot.hulp.hints === 1 ? "Bekijk hint 2" : "Bekijk de uitleg";
  const hulpKort = slot.hulp.hints === 0 ? "Hint" : slot.hulp.hints === 1 ? "Hint 2" : "Uitleg";
  const hulpUitleg = hulpUit ?? (slot.hulp.hints === 0 ? "Je kunt twee hints bekijken." : slot.hulp.hints === 1 ? "Hint 1 is bekeken." : "Beide hints zijn bekeken.");

  return (
    <div className="sticky bottom-0 z-20 border-t border-rand-zacht bg-wit/95 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur tablet:pb-6 tablet:pt-5">
      <div className="mees-content tablet:max-w-[1100px]">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 tablet:grid-cols-[auto_1fr_auto] tablet:items-start tablet:gap-6">
          <div className="flex min-w-0 flex-col gap-1">
            <SecundaireKnop onClick={onHulp} disabled={vergrendeld || Boolean(hulpUit)} className="w-full border-actie-blauw px-3 tablet:w-auto desktop:min-w-56">
              <Icoon naam="hint" className="size-6" />
              <span className="min-[360px]:hidden" aria-hidden>
                {hulpKort}
              </span>
              <span className="max-[359px]:sr-only">{hulpLabel}</span>
            </SecundaireKnop>
            <p className="hidden pl-2 tekst-klein text-tekst-zacht desktop:block">{hulpUitleg}</p>
          </div>
          <div className="col-span-2 flex gap-2 tablet:col-span-1 tablet:justify-center tablet:gap-3">
            <VoorleesKnop tekst={voorleesTekst} compact />
            <LeesoptiesKnop compact />
          </div>
          <div className="col-span-3 tablet:col-span-1">
            {klaar || uitlegZichtbaar ? (
              <PrimaireKnop groot onClick={onVolgende} className="w-full tablet:w-auto desktop:min-w-64">
                {uitlegZichtbaar && !klaar ? "Verder" : laatste ? "Afronden" : "Volgende vraag"}
                <Icoon naam="pijl-rechts" />
              </PrimaireKnop>
            ) : (
              <div className="flex flex-col gap-1">
                <PrimaireKnop groot onClick={onControleer} disabled={!kanControleren} className="w-full tablet:w-auto desktop:min-w-64">
                  {controleerLabel}
                </PrimaireKnop>
                {!kanControleren && <p className="hidden tekst-klein text-tekst-zacht desktop:block desktop:text-right">{kiesEerst}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
