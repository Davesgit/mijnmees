"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Breuk } from "@/components/mees/Breuk";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { Mees } from "@/components/mees/Mees";
import { vindOnderdeel } from "@/content/onderwerpen";
import { rondOvergangAf, sessieRoute } from "@/features/oefenen/sessie";
import type { Sessie, Slot } from "@/features/oefenen/types";
import { FeedbackEnHulp, OefenBediening, OefenKop, useVraagplaats, VraagTitel } from "@/features/oefenen/ui/Oefenkader";
import { vindVraag, type BreukVergelijkVraag, type TafelVraag, type Vraag } from "@/features/oefenen/vragen";
import { useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";

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

/** Meet alleen actieve antwoordtijd: niet als het tabblad verborgen is. */
function useActieveTijd() {
  const start = useRef(0);
  const opgeteld = useRef(0);
  const [, ververs] = useState(0);
  useEffect(() => {
    start.current = performance.now();
    const zichtbaarheid = () => {
      if (document.hidden) {
        opgeteld.current += performance.now() - start.current;
      } else {
        start.current = performance.now();
      }
    };
    document.addEventListener("visibilitychange", zichtbaarheid);
    const tik = setInterval(() => ververs((n) => n + 1), 1000);
    return () => {
      document.removeEventListener("visibilitychange", zichtbaarheid);
      clearInterval(tik);
    };
  }, []);
  return () => opgeteld.current + (document.hidden ? 0 : performance.now() - start.current);
}

function Vraagplaats({ sessie, slot, vraag, rustigVerder }: { sessie: Sessie; slot: Slot; vraag: Vraag; rustigVerder: boolean }) {
  const actieveTijd = useActieveTijd();
  const v = useVraagplaats({ sessie, slot, rustigVerder, actieveDuur: vraag.soort === "tafel" ? actieveTijd : undefined });
  const nummer = sessie.index + 1;
  const aantal = sessie.soort === "niveau" ? sessie.aantal : sessie.slots.length;
  const afgehandeld = sessie.slots.filter((s) => s.uitkomst).length;
  const metTijd = sessie.soort === "tafels" && sessie.instellingen?.metTijd;

  const voorleesTekst =
    vraag.soort === "breuk"
      ? `${vraag.prompt} ${vraag.visual.links.join("/")} en ${vraag.visual.rechts.join("/")}. ${vraag.instructie}`
      : `${vraag.prompt.replace("×", "keer").replace(":", "gedeeld door")} ${vraag.instructie}`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mees-content flex flex-1 flex-col pt-4 tablet:max-w-[1100px] tablet:pt-6 desktop:pt-8">
        <OefenKop
          terug={terugVoor(sessie)}
          voortgang={{ label: `Vraag ${nummer} van ${aantal}`, aantal, afgehandeld, huidige: sessie.index }}
          onStop={v.stop}
          onTerug={v.stopOvergang}
          rechts={metTijd ? <Tijd ms={actieveTijd()} /> : undefined}
        />

        <section aria-labelledby="vraag-titel" className="flex flex-1 flex-col items-center py-6 text-center tablet:py-8">
          {sessie.soort === "niveau" && <p className="mb-2 tekst-klein font-semibold text-actie-blauw">Dit helpt Mees een passend begin te kiezen.</p>}
          <VraagTitel titelRef={v.titelRef} vraag={vraag.soort === "breuk" && sessie.soort === "niveau" ? "Vergelijk de breuken" : vraag.prompt} instructie={vraag.soort === "breuk" ? vraag.instructie : "Vul het antwoord in."} />
          {vraag.soort === "breuk" ? (
            <BreukAntwoord vraag={vraag} gekozen={v.gekozen} kies={v.kies} vergrendeld={v.vergrendeld} />
          ) : vraag.soort === "tafel" ? (
            <TafelAntwoord vraag={vraag} gekozen={v.gekozen} kies={v.kies} vergrendeld={v.vergrendeld} onEnter={() => v.controleer()} />
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

function TafelAntwoord({
  vraag,
  gekozen,
  kies,
  vergrendeld,
  onEnter,
}: {
  vraag: TafelVraag;
  gekozen: string | null;
  kies: (w: string) => void;
  vergrendeld: boolean;
  onEnter: () => void;
}) {
  const veld = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!vergrendeld) veld.current?.focus({ preventScroll: true });
  }, [vergrendeld]);
  return (
    <div className="mt-6 flex flex-col items-center gap-6 tablet:mt-10">
      <div className="som flex items-center justify-center gap-4 text-inkt tablet:gap-8">
        <Mees pose="blij" breedte={140} className="hidden w-28 tablet:block desktop:w-36" />
        <span aria-hidden className="text-[1.15em]">
          {vraag.links} {vraag.bewerking === "x" ? "×" : ":"} {vraag.rechts} =
        </span>
      </div>
      <label className="sr-only" htmlFor="tafel-antwoord">
        Antwoord
      </label>
      <input
        ref={veld}
        id="tafel-antwoord"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={4}
        value={gekozen ?? ""}
        readOnly={vergrendeld}
        onChange={(e) => kies(e.target.value.replace(/[^0-9]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        className="som h-20 w-48 rounded-[16px] border-2 border-rand-interactief bg-wit text-center text-inkt focus:border-actie-blauw tablet:h-24 tablet:w-64"
      />
    </div>
  );
}
