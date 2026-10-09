"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Breuk } from "@/components/mees/Breuk";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { Mees } from "@/components/mees/Mees";
import { vindOnderdeel } from "@/content/onderwerpen";
import { rondOvergangAf, sessieRoute } from "@/features/oefenen/sessie";
import type { Sessie, Slot } from "@/features/oefenen/types";
import { FeedbackEnHulp, OefenBediening, OefenKop, useVraagplaats, VraagTitel } from "@/features/oefenen/ui/Oefenkader";
import { vindVraag, type BreukVergelijkVraag, type TafelVraag, type Vraag } from "@/features/oefenen/vragen";
import { useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";
import { vraagVoorleesTekst } from "@/features/voorlezen/teksten";

/** Oefenscherm voor rekenoefeningen, de tafeltrainer en de niveaubepaling. */
export function OefenScherm({ sessieId }: { sessieId: string }) {
  const router = useRouter();
  const opslag = useOpslag();
  const sessie = opslag?.sessies[sessieId];

  // Bij openen: een onderbroken overgang na een goed antwoord afronden (hervat bij de volgende vraag).
  useEffect(() => {
    if (sessie?.status === "bezig" && sessie.slots[sessie.index]?.uitkomst) wijzigOpslag((d) => rondOvergangAf(d, sessieId));
    // Alleen bij openen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessie?.status === "afgerond") router.replace(sessieRoute(sessie));
  }, [sessie, router]);

  if (opslag === null) return <Laden />;
  if (!sessie) {
    return (
      <div className="mees-content py-10">
        <h1 className="titel-pagina">Oefenen</h1>
        <Melding className="mt-6">
          Er is geen oefening geopend. Kies eerst een onderwerp.{" "}
          <Link href="/kind/start" className="font-bold text-actie-blauw underline underline-offset-4">
            Naar start
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

function terugVoor(sessie: Sessie) {
  if (sessie.soort === "tafels") return { href: "/kind/tafeltrainer", kort: "Tafels", lang: "Tafeltrainer" };
  if (sessie.soort === "niveau") return { href: "/kind/niveaubepaling", kort: "Terug", lang: "Wat past bij jou?" };
  if (sessie.soort === "controle") return { href: sessie.instellingen?.controleVoor ? `/kind/hulpvragen/${sessie.instellingen.controleVoor}` : "/kind/start", kort: "Terug", lang: "Je hulpvraag" };
  const o = vindOnderdeel(sessie.onderdeelId);
  return { href: `/kind/oefening/instellen?onderdeel=${sessie.onderdeelId}`, kort: o?.onderwerp.naam ?? "Terug", lang: o?.onderdeel.naam ?? "Terug" };
}

/** Meet alleen actieve antwoordtijd: niet als het tabblad verborgen is. Stopt zodra de vraag klaar is. */
function useActieveTijd(tikMs = 1000, gestopt = false) {
  const start = useRef(0);
  const opgeteld = useRef(0);
  const loopt = useRef(true);
  const [, ververs] = useState(0);
  useEffect(() => {
    start.current = performance.now();
    const zichtbaarheid = () => {
      if (!loopt.current) return;
      if (document.hidden) opgeteld.current += performance.now() - start.current;
      else start.current = performance.now();
    };
    document.addEventListener("visibilitychange", zichtbaarheid);
    return () => document.removeEventListener("visibilitychange", zichtbaarheid);
  }, []);
  useEffect(() => {
    if (gestopt) {
      if (loopt.current && !document.hidden) opgeteld.current += performance.now() - start.current;
      loopt.current = false;
      return;
    }
    const tik = setInterval(() => ververs((n) => n + 1), tikMs);
    return () => clearInterval(tik);
  }, [tikMs, gestopt]);
  return () => opgeteld.current + (loopt.current && !document.hidden ? performance.now() - start.current : 0);
}

function Vraagplaats({ sessie, slot, vraag, rustigVerder }: { sessie: Sessie; slot: Slot; vraag: Vraag; rustigVerder: boolean }) {
  const limietMs = sessie.soort === "tafels" && sessie.instellingen?.metTijd && sessie.instellingen.secondenPerVraag ? sessie.instellingen.secondenPerVraag * 1000 : null;
  const actieveTijd = useActieveTijd(limietMs ? 100 : 1000, Boolean(slot.uitkomst));
  const v = useVraagplaats({ sessie, slot, rustigVerder, actieveDuur: vraag.soort === "tafel" ? actieveTijd : undefined, eigenFocus: vraag.soort === "tafel" });
  const nummer = sessie.index + 1;
  const aantal = sessie.soort === "niveau" ? sessie.aantal : sessie.slots.length;
  const afgehandeld = sessie.slots.filter((s) => s.uitkomst).length;
  const metTijd = sessie.soort === "tafels" && sessie.instellingen?.metTijd && !limietMs;

  const voorleesTekst = vraagVoorleesTekst(vraag);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mees-content flex flex-1 flex-col pt-[max(1rem,env(safe-area-inset-top))] tablet:max-w-[1100px] tablet:pt-6 desktop:pt-8">
        <OefenKop
          terug={terugVoor(sessie)}
          voortgang={{ label: `Vraag ${nummer} van ${aantal}`, aantal, afgehandeld, huidige: sessie.index }}
          onStop={v.stop}
          onTerug={v.stopOvergang}
          rechts={metTijd ? <Tijd ms={actieveTijd()} /> : undefined}
        />

        {limietMs && <Afteller resterendMs={Math.max(0, limietMs - actieveTijd())} totaalMs={limietMs} klaar={Boolean(slot.uitkomst)} />}

        <section aria-labelledby="vraag-titel" className="flex flex-1 flex-col items-center py-6 text-center tablet:py-8">
          {sessie.soort === "niveau" && <p className="mb-2 tekst-klein font-semibold text-actie-blauw">Dit helpt Mees een passend begin te kiezen.</p>}
          <VraagTitel titelRef={v.titelRef} vraag={vraag.soort === "breuk" && sessie.soort === "niveau" ? "Vergelijk de breuken" : vraag.prompt} instructie={vraag.soort === "breuk" ? vraag.instructie : "Vul het antwoord in."} klein={vraag.soort === "tafel"} />
          {vraag.soort === "breuk" ? (
            <BreukAntwoord vraag={vraag} gekozen={v.gekozen} kies={v.kies} vergrendeld={v.vergrendeld} />
          ) : vraag.soort === "tafel" ? (
            <TafelAntwoord vraag={vraag} gekozen={v.gekozen} kies={v.kies} vergrendeld={v.vergrendeld} poging={slot.hulp.fouten + slot.hulp.hints} onEnter={() => v.controleer()} />
          ) : null}
          <FeedbackEnHulp feedback={v.feedback} slot={slot} vraag={vraag} bewaarFout={v.bewaarFout} />
        </section>
      </div>

      <OefenBediening
        slot={slot}
        vergrendeld={v.vergrendeld}
        klaar={v.klaar}
        uitlegZichtbaar={v.uitlegZichtbaar}
        laatste={nummer === aantal}
        kanControleren={Boolean(v.gekozen?.trim())}
        kiesEerst={vraag.soort === "tafel" ? "Vul eerst een antwoord in." : "Kies eerst een teken."}
        voorleesTekst={voorleesTekst}
        onHulp={v.hulp}
        onControleer={() => v.controleer()}
        onVolgende={v.volgende}
      />
    </div>
  );
}

const BIJNA_OM_MS = 3000;

/** Afteller per vraag: de balk loopt leeg en wordt oranje in de laatste seconden. Is de tijd om, dan mag het antwoord nog. */
function Afteller({ resterendMs, totaalMs, klaar }: { resterendMs: number; totaalMs: number; klaar: boolean }) {
  const seconden = Math.ceil(resterendMs / 1000);
  const om = resterendMs <= 0;
  const bijnaOm = !om && resterendMs <= BIJNA_OM_MS;
  const melding = klaar ? "" : om ? "De tijd is om. Je mag het antwoord nog invullen." : bijnaOm ? "Nog 3 seconden." : "";
  return (
    <div className="mx-auto mt-3 w-full max-w-xl">
      <div className="flex items-center justify-between gap-3 tekst-klein font-bold" aria-hidden>
        <span className={`inline-flex items-center gap-1.5 ${bijnaOm ? "text-probeer-opnieuw" : om ? "text-tekst-zacht" : "text-inkt"}`}>
          <Icoon naam="tijd" className="size-5" />
          {klaar ? (om ? "Klaar" : "Op tijd!") : om ? "De tijd is om" : bijnaOm ? `Nog ${seconden}…` : `Nog ${seconden} seconden`}
        </span>
        {om && !klaar && <span className="font-semibold text-tekst-zacht">Je mag het nog invullen</span>}
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-uitgeschakeld-vlak" aria-hidden>
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-100 ease-linear ${bijnaOm ? "bg-[#ea580c]" : "bg-actie-blauw"} ${bijnaOm && !klaar ? "animate-pulse" : ""}`}
          style={{ width: `${(resterendMs / totaalMs) * 100}%` }}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {melding}
      </p>
    </div>
  );
}

function Tijd({ ms }: { ms: number }) {
  const s = Math.floor(ms / 1000);
  return (
    <span className="hidden min-h-10 items-center rounded-full bg-blauw-zacht px-3 tekst-klein font-semibold tabular-nums tablet:inline-flex" aria-label={`Tijd: ${s} seconden`}>
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

function BreukAntwoord({ vraag, gekozen, kies, vergrendeld }: { vraag: BreukVergelijkVraag; gekozen: string | null; kies: (w: string) => void; vergrendeld: boolean }) {
  const [l1, l2] = vraag.visual.links;
  const [r1, r2] = vraag.visual.rechts;
  return (
    <>
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
                  isGekozen ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-rand-interactief bg-[#f5faff] [@media(hover:hover)]:hover:bg-blauw-zacht"
                } ${vergrendeld ? "cursor-default" : ""}`}
              >
                <input type="radio" name="antwoord" value={optie} checked={isGekozen} onChange={() => kies(optie)} className="sr-only" aria-label={label} />
                <span aria-hidden>{optie}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

const geenAbonnement = () => () => {};
/** Telefoon of tablet (aanraakscherm als belangrijkste invoer). */
const isAanraak = () => matchMedia("(pointer: coarse)").matches;

function TafelAntwoord({
  vraag,
  gekozen,
  kies,
  vergrendeld,
  poging,
  onEnter,
}: {
  vraag: TafelVraag;
  gekozen: string | null;
  kies: (w: string) => void;
  vergrendeld: boolean;
  /** Verandert na een fout antwoord of een hint: dan staat het veld meteen weer klaar. */
  poging: number;
  onEnter: () => void;
}) {
  const veld = useRef<HTMLInputElement>(null);
  // Op een aanraakscherm: eigen cijfertoetsen in plaats van het toetsenbord van het apparaat
  // (dat springt op, dekt de knoppen af en moet op een iPhone eerst weer weg).
  const aanraak = useSyncExternalStore(geenAbonnement, isAanraak, () => false);
  const waarde = gekozen ?? "";
  const zet = (nieuw: string) => kies(nieuw.replace(/[^0-9]/g, "").slice(0, 4));

  // Het antwoordveld staat altijd klaar om te typen: bij een nieuwe vraag, na een fout antwoord en na een hint.
  useEffect(() => {
    if (vergrendeld || aanraak || !veld.current) return;
    veld.current.focus({ preventScroll: true });
    veld.current.select();
  }, [vergrendeld, poging, vraag.id, aanraak]);

  // Aanraakscherm met een los toetsenbord (bijvoorbeeld een iPad): typen werkt ook zonder het veld aan te tikken.
  useEffect(() => {
    if (!aanraak || vergrendeld) return;
    const toets = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.closest("input, textarea, select")) return;
      if (/^[0-9]$/.test(e.key)) zet(waarde + e.key);
      else if (e.key === "Backspace") zet(waarde.slice(0, -1));
      else if (e.key === "Enter") onEnter();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", toets);
    return () => window.removeEventListener("keydown", toets);
  });

  const basisToets = "grid min-h-14 place-items-center rounded-[14px] border text-2xl font-bold select-none [touch-action:manipulation] disabled:opacity-40";
  const toetsKlasse = `${basisToets} border-rand-interactief bg-wit text-inkt active:bg-blauw-zacht`;

  const antwoordVeld = (
    <>
      <label className="sr-only" htmlFor="tafel-antwoord">
        Antwoord op {vraag.links} {vraag.bewerking === "x" ? "keer" : "gedeeld door"} {vraag.rechts}
      </label>
      <input
        ref={veld}
        id="tafel-antwoord"
        type="text"
        inputMode={aanraak ? "none" : "numeric"}
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={4}
        value={waarde}
        readOnly={vergrendeld || aanraak}
        onChange={(e) => zet(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        className={`som rounded-[16px] border-2 border-rand-interactief bg-wit text-center text-inkt focus:border-actie-blauw ${aanraak ? "h-16 w-32 tablet:h-20 tablet:w-44" : "h-20 w-48 tablet:h-24 tablet:w-64"}`}
      />
    </>
  );

  return (
    <div className="mt-3 flex w-full flex-col items-center gap-3 tablet:mt-10 tablet:gap-6">
      <div className="som flex items-center justify-center gap-3 text-inkt tablet:gap-8">
        <Mees pose="blij" breedte={140} className="hidden w-28 tablet:block desktop:w-36" />
        <span aria-hidden className="text-[1.15em]">
          {vraag.links} {vraag.bewerking === "x" ? "×" : ":"} {vraag.rechts} =
        </span>
        {aanraak && antwoordVeld}
      </div>
      {!aanraak && antwoordVeld}
      {aanraak && (
        <div role="group" aria-label="Cijfers" className="grid w-full max-w-[20rem] grid-cols-3 gap-2.5 tablet:max-w-[22rem] tablet:[&>button]:min-h-16">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((c) => (
            <button key={c} type="button" className={toetsKlasse} disabled={vergrendeld} onClick={() => zet(waarde + c)}>
              {c}
            </button>
          ))}
          <button type="button" className={toetsKlasse} disabled={vergrendeld || !waarde} onClick={() => zet(waarde.slice(0, -1))} aria-label="Wis laatste cijfer">
            <Icoon naam="pijl-links" className="size-7" />
          </button>
          <button type="button" className={toetsKlasse} disabled={vergrendeld} onClick={() => zet(waarde + "0")}>
            0
          </button>
          <button
            type="button"
            className={`${basisToets} border-actie-blauw bg-actie-blauw text-wit active:bg-actie-ingedrukt`}
            disabled={vergrendeld || !waarde}
            onClick={onEnter}
            aria-label="Controleer antwoord"
          >
            <Icoon naam="check" className="size-8" />
          </button>
        </div>
      )}
    </div>
  );
}
