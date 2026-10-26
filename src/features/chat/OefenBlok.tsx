"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Breuk, TekstMetBreuken } from "@/components/mees/Breuk";
import { Icoon } from "@/components/mees/Icoon";
import { vindWeetje } from "@/content/weetjes";
import { gaVerder, registreerAntwoord, sessieStatistiek, vraagHulp } from "@/features/oefenen/sessie";
import type { OpslagData, Sessie, Slot } from "@/features/oefenen/types";
import { sessieNaam } from "@/features/oefenen/weergave";
import { antwoordTekst, goedAntwoordTekst, vindVraag, type BreukVergelijkVraag, type TafelVraag, type Vraag } from "@/features/oefenen/vragen";
import { hintVoorleesTekst, uitlegVoorleesTekst, vraagVoorleesTekst } from "@/features/voorlezen/teksten";
import { useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";
import { MeesAfzender, VoorleesLink } from "./ChatVoorlezen";
import { EuropaOpgave, EuropaUitlegKaart, PuzzelBlok } from "./EuropaInChat";
import type { OefenVerwijzing } from "./gesprek";
import { verloopVanSlot, type Hulp, type Stap } from "./oefen-verloop";

type BreukOfTafel = Vraag;

/**
 * Een oefening in het gesprek. Alle pogingen blijven staan; alleen de nieuwste vraag is interactief.
 * Antwoordcontrole, hulp en voortgang komen uit de oefenmotor (sessie.ts) en de lokale opslag.
 */
export function OefenBlok({ verwijzing, actief, onNogEenRondje, onIetsAnders }: { verwijzing: OefenVerwijzing; actief: boolean; onNogEenRondje: () => void; onIetsAnders: () => void }) {
  const opslag = useOpslag();
  const sessie = opslag?.sessies[verwijzing.sessieId];
  const [bewaarFout, setBewaarFout] = useState(false);
  if (!opslag || !sessie) return null;

  const eind = verwijzing.tot ?? Math.min(sessie.index + 1, sessie.slots.length);
  const interactief = actief && verwijzing.tot === undefined && sessie.status === "bezig";
  const bewaar = (w: (d: OpslagData) => OpslagData) => setBewaarFout(!wijzigOpslag(w));

  if (sessie.soort === "puzzel")
    return (
      <>
        {(sessie.status === "bezig" || verwijzing.tot !== undefined) && <PuzzelBlok sessie={sessie} interactief={interactief} bewaar={bewaar} />}
        {bewaarFout && <p className="rounded-[16px] bg-fout-zacht p-4 font-semibold text-fout">Bewaren lukt nu niet. Sluit dit scherm nog niet.</p>}
        {actief && verwijzing.tot === undefined && sessie.status === "afgerond" && <Terugblik sessie={sessie} opslag={opslag} onNogEenRondje={onNogEenRondje} onIetsAnders={onIetsAnders} />}
      </>
    );

  return (
    <>
      {sessie.slots.slice(verwijzing.vanaf, eind).map((slot, i) => {
        const index = verwijzing.vanaf + i;
        const vraag = vindVraag(slot.vraagId);
        if (!vraag || (vraag.soort === "europa" && vraag.type === "puzzel")) return null;
        return (
          <SlotVerloop
            key={slot.id}
            sessie={sessie}
            slot={slot}
            vraag={vraag}
            nummer={index + 1}
            pogingen={opslag.pogingen.filter((p) => p.sessieId === sessie.id && p.slotId === slot.id)}
            interactief={interactief && index === sessie.index}
            bewaar={bewaar}
          />
        );
      })}
      {bewaarFout && <p className="rounded-[16px] bg-fout-zacht p-4 font-semibold text-fout">Bewaren lukt nu niet. Sluit dit scherm nog niet.</p>}
      {actief && verwijzing.tot === undefined && sessie.status === "afgerond" && <Terugblik sessie={sessie} opslag={opslag} onNogEenRondje={onNogEenRondje} onIetsAnders={onIetsAnders} />}
    </>
  );
}

function SlotVerloop({
  sessie,
  slot,
  vraag,
  nummer,
  pogingen,
  interactief,
  bewaar,
}: {
  sessie: Sessie;
  slot: Slot;
  vraag: BreukOfTafel;
  nummer: number;
  pogingen: Parameters<typeof verloopVanSlot>[1];
  interactief: boolean;
  bewaar: (w: (d: OpslagData) => OpslagData) => void;
}) {
  const stappen = verloopVanSlot(slot, pogingen);
  const laatsteVraag = stappen.findLastIndex((s) => s.soort === "vraag");
  const sleutel = (s: Stap, i: number) => `${slot.id}-${i}-${s.soort}`;

  return (
    <>
      {stappen.map((stap, i) => {
        const id = sleutel(stap, i);
        switch (stap.soort) {
          case "vraag":
            return (
              <VraagKaart
                key={id}
                id={id}
                vraag={vraag}
                sessie={sessie}
                opties={vraag.soort === "europa" ? (vraag.opties ?? slot.opties ?? []) : []}
                nummer={nummer}
                herhaling={Boolean(slot.herhalingVan)}
                stap={stap}
                interactief={interactief && stap.status === "open" && i === laatsteVraag}
                seconden={sessie.soort === "tafels" && sessie.instellingen?.metTijd ? (sessie.instellingen.secondenPerVraag ?? null) : null}
                onControleer={(antwoord, actieveDuurMs) => bewaar((d) => registreerAntwoord(d, sessie.id, antwoord, { actieveDuurMs })?.data ?? d)}
                onHint={() => bewaar((d) => vraagHulp(d, sessie.id))}
                hintLabel={slot.hulp.hints === 0 ? "Geef me een hint" : slot.hulp.hints === 1 ? "Nog een hint" : "Laat de uitleg zien"}
              />
            );
          case "fout":
            return (
              <Kaart key={id} toon="fout" voorlees={{ id, tekst: `Nog niet helemaal. Jij koos ${antwoordWoorden(vraag, stap.antwoord)}. ${hulpTekstVoorlezen(vraag, stap.hulp)}` }}>
                <h3 className="text-xl font-extrabold text-probeer-opnieuw">Nog niet helemaal</h3>
                <p className="mt-2 rounded-[12px] bg-[#fdebc8] px-4 py-2.5 font-bold text-probeer-opnieuw">
                  Jij koos {antwoordWoorden(vraag, stap.antwoord)}. Dat is nog niet het goede antwoord.
                </p>
                {stap.hulp ? <HulpInhoud vraag={vraag} hulp={stap.hulp} /> : <p className="mt-3 text-lg">Kijk nog eens rustig naar de vraag. Probeer het hieronder opnieuw.</p>}
              </Kaart>
            );
          case "hulpVraag":
            return (
              <div key={id} data-stap={id} className="ml-auto max-w-[85%] rounded-[20px] bg-[#e0f2ff] px-5 py-3.5 text-lg">
                <span className="sr-only">Jij: </span>
                {stap.hulp.soort === "uitleg" ? "Laat de uitleg zien." : stap.hulp.niveau === 1 ? "Geef me een hint." : "Mag ik nog een hint?"}
              </div>
            );
          case "hulp":
            return (
              <Kaart key={id} toon="hulp" voorlees={{ id, tekst: hulpTekstVoorlezen(vraag, stap.hulp) }}>
                <HulpInhoud vraag={vraag} hulp={stap.hulp} />
              </Kaart>
            );
          case "goed":
            return (
              <Kaart key={id} toon="goed" voorlees={{ id, tekst: `Goed gevonden! ${vraag.explanation}` }}>
                <h3 className="text-xl font-extrabold text-succes">{stap.metHulp ? "Goed gevonden! Je hebt de hulp goed gebruikt." : "Goed gevonden!"}</h3>
                <p className="mt-2 text-lg">
                  <TekstMetBreuken tekst={vraag.explanation} />
                </p>
                {interactief && (
                  <button type="button" onClick={() => bewaar((d) => gaVerder(d, sessie.id))} className={`${hoofdKnop} mt-4`}>
                    {sessie.index + 1 >= sessie.slots.length ? "Rond af" : "Volgende vraag"}
                    <Icoon naam="pijl-rechts" className="size-6" />
                  </button>
                )}
              </Kaart>
            );
          case "verder":
            return interactief ? (
              <div key={id} data-stap={id} className="w-full tablet:max-w-[92%]">
                {vraag.soort === "europa" && <EuropaUitlegKaart vraag={vraag} sessie={sessie} />}
                <button type="button" onClick={() => bewaar((d) => gaVerder(d, sessie.id))} className={`${hoofdKnop} mt-4`}>
                  {sessie.index + 1 >= sessie.slots.length ? "Rond af" : "Verder"}
                  <Icoon naam="pijl-rechts" className="size-6" />
                </button>
              </div>
            ) : null;
        }
      })}
    </>
  );
}

const hoofdKnop =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-[14px] bg-actie-blauw px-6 text-lg font-bold text-wit hover:bg-actie-hover active:bg-actie-ingedrukt disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst";

function Kaart({ toon, voorlees, children }: { toon: "normaal" | "fout" | "hulp" | "goed"; voorlees: { id: string; tekst: string }; children: ReactNode }) {
  const stijl = {
    normaal: "border-[#e9f5ff] bg-wit",
    fout: "border-2 border-[#e2a23b] bg-probeer-opnieuw-zacht",
    hulp: "border-[#cfe6fb] bg-blauw-zacht",
    goed: "border-2 border-[#86d3a6] bg-succes-zacht",
  }[toon];
  return (
    <div data-stap={voorlees.id} className={`mees-verschijn w-full tablet:max-w-[92%] rounded-[20px] border px-5 py-4 shadow-[0_8px_24px_#92c5eb17] tablet:px-6 ${stijl}`}>
      <MeesAfzender />
      <div className="mt-2">{children}</div>
      <div className="mt-2">
        <VoorleesLink id={voorlees.id} tekst={voorlees.tekst} />
      </div>
    </div>
  );
}

function HulpInhoud({ vraag, hulp }: { vraag: BreukOfTafel; hulp: Hulp }) {
  if (hulp.soort === "uitleg")
    return (
      <div className="mt-3">
        <h4 className="font-bold text-actie-blauw">Uitleg</h4>
        <p className="mt-1 text-lg">
          <TekstMetBreuken tekst={vraag.explanation} />
        </p>
        <p className="mt-2 font-bold">
          Het goede antwoord is <span className="text-xl">{goedAntwoordTekst(vraag)}</span>.
        </p>
      </div>
    );
  return (
    <div className="mt-3 flex items-start gap-3">
      <Icoon naam="hint" className="mt-0.5 size-7 shrink-0 text-actie-blauw" />
      <div>
        <h4 className="font-bold text-actie-blauw">Hint {hulp.niveau} van 2</h4>
        <p className="mt-1 text-lg">
          <TekstMetBreuken tekst={vraag.hints[hulp.niveau - 1]} />
        </p>
      </div>
    </div>
  );
}

function hulpTekstVoorlezen(vraag: BreukOfTafel, hulp: Hulp | null) {
  if (!hulp) return "Kijk nog eens rustig naar de vraag.";
  return hulp.soort === "uitleg" ? uitlegVoorleesTekst(vraag) : hintVoorleesTekst(vraag, hulp.niveau - 1);
}

function antwoordWoorden(vraag: BreukOfTafel, antwoord: string) {
  if (vraag.soort === "europa") return antwoordTekst(vraag, antwoord);
  if (vraag.soort === "breuk") return antwoord === "<" ? "< (is kleiner dan)" : antwoord === ">" ? "> (is groter dan)" : "= (is gelijk aan)";
  return antwoord;
}

function VraagKaart({
  id,
  vraag,
  sessie,
  opties,
  nummer,
  herhaling,
  stap,
  interactief,
  seconden,
  onControleer,
  onHint,
  hintLabel,
}: {
  id: string;
  vraag: BreukOfTafel;
  sessie: Sessie;
  opties: { id: string; label: string }[];
  nummer: number;
  herhaling: boolean;
  stap: Extract<Stap, { soort: "vraag" }>;
  interactief: boolean;
  /** Tafels op tijd: seconden per vraag (afteller). */
  seconden?: number | null;
  onControleer: (antwoord: string, actieveDuurMs?: number) => void;
  onHint: () => void;
  hintLabel: string;
}) {
  const [gekozen, setGekozen] = useState<string>("");
  const tijd = useActieveTijd(interactief && Boolean(seconden));
  const titel = stap.opnieuw ? "Probeer het nog eens." : herhaling ? "Nog een soortgelijke vraag." : `Vraag ${nummer}`;
  const getoond = interactief ? gekozen : (stap.antwoord ?? "");

  return (
    <div data-stap={id} className={`w-full tablet:max-w-[92%] rounded-[20px] border border-[#e9f5ff] bg-wit px-5 py-4 shadow-[0_8px_24px_#92c5eb17] tablet:px-6 ${interactief ? "" : "opacity-90"}`}>
      <MeesAfzender />
      <p className="mt-2 font-semibold text-actie-blauw">{titel}</p>
      <h3 className="mt-1 text-xl font-extrabold tablet:text-2xl">{vraag.prompt}</h3>
      {vraag.soort !== "tafel" && <p className="mt-1 text-[#5b6fae]">{vraag.instructie}</p>}
      {interactief && seconden ? <Afteller resterendMs={Math.max(0, seconden * 1000 - tijd.nu)} totaalMs={seconden * 1000} /> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (interactief && gekozen.trim()) onControleer(gekozen.trim(), vraag.soort === "tafel" ? tijd.ms() : undefined);
        }}
      >
        {vraag.soort === "breuk" ? (
          <BreukOpgave vraag={vraag} gekozen={getoond} onKies={setGekozen} vergrendeld={!interactief} groep={id} />
        ) : vraag.soort === "tafel" ? (
          <TafelOpgave vraag={vraag} waarde={getoond} onWijzig={setGekozen} vergrendeld={!interactief} id={id} />
        ) : interactief ? (
          // Europa: alleen de open vraag krijgt een kaart; eerdere pogingen staan als tekst.
          <EuropaOpgave vraag={vraag} sessie={sessie} opties={opties} gekozen={gekozen} onKies={setGekozen} />
        ) : null}

        {interactief ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!gekozen.trim()} className={hoofdKnop}>
              Kijk samen met Mees
              <Icoon naam="pijl-rechts" className="size-6" />
            </button>
            <button type="button" onClick={onHint} className="inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht">
              <Icoon naam="hint" className="size-6" />
              {hintLabel}
            </button>
          </div>
        ) : (
          stap.antwoord && <p className="mt-3 tekst-klein text-tekst-zacht">Jouw antwoord: {antwoordWoorden(vraag, stap.antwoord)}</p>
        )}
      </form>
      <div className="mt-2">
        <VoorleesLink id={id} tekst={vraagVoorleesTekst(vraag)} />
      </div>
    </div>
  );
}

/** Actieve antwoordtijd: telt niet door als het tabblad verborgen is. `nu` ververst tien keer per seconde. */
function useActieveTijd(loopt: boolean) {
  const opgeteld = useRef(0);
  const start = useRef<number | null>(null);
  const [nu, setNu] = useState(0);
  useEffect(() => {
    if (!loopt) return;
    start.current = document.hidden ? null : performance.now();
    const meet = () => opgeteld.current + (start.current === null ? 0 : performance.now() - start.current);
    const zicht = () => {
      if (document.hidden && start.current !== null) {
        opgeteld.current += performance.now() - start.current;
        start.current = null;
      } else if (!document.hidden && start.current === null) start.current = performance.now();
    };
    const tik = setInterval(() => setNu(meet()), 100);
    document.addEventListener("visibilitychange", zicht);
    return () => {
      opgeteld.current = meet();
      start.current = null;
      clearInterval(tik);
      document.removeEventListener("visibilitychange", zicht);
    };
  }, [loopt]);
  return { nu, ms: () => opgeteld.current + (start.current === null ? 0 : performance.now() - start.current) };
}

/** Afteller per vraag: de balk loopt leeg en wordt oranje in de laatste seconden. Na de tijd mag het antwoord nog. */
function Afteller({ resterendMs, totaalMs }: { resterendMs: number; totaalMs: number }) {
  const om = resterendMs <= 0;
  const bijnaOm = !om && resterendMs <= 3000;
  return (
    <div className="mt-3">
      <p className={`flex items-center gap-1.5 tekst-klein font-bold ${bijnaOm ? "text-probeer-opnieuw" : om ? "text-tekst-zacht" : ""}`} aria-hidden>
        <Icoon naam="tijd" className="size-5" />
        {om ? "De tijd is om. Je mag het antwoord nog invullen." : `Nog ${Math.ceil(resterendMs / 1000)} seconden`}
      </p>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-uitgeschakeld-vlak" aria-hidden>
        <div className={`h-full rounded-full ${bijnaOm ? "animate-pulse bg-[#ea580c]" : "bg-actie-blauw"}`} style={{ width: `${(resterendMs / totaalMs) * 100}%` }} />
      </div>
      <p className="sr-only" aria-live="polite">
        {om ? "De tijd is om. Je mag het antwoord nog invullen." : bijnaOm ? "Nog 3 seconden." : ""}
      </p>
    </div>
  );
}

function BreukOpgave({ vraag, gekozen, onKies, vergrendeld, groep }: { vraag: BreukVergelijkVraag; gekozen: string; onKies: (w: string) => void; vergrendeld: boolean; groep: string }) {
  const [l1, l2] = vraag.visual.links;
  const [r1, r2] = vraag.visual.rechts;
  return (
    <>
      <div className="mt-4 flex items-center justify-center gap-5 text-[2.75rem] font-bold text-inkt tablet:gap-8 tablet:text-[3.25rem]" role="group" aria-label={`Breuk ${l1}/${l2} en breuk ${r1}/${r2}`}>
        <Breuk teller={l1} noemer={l2} />
        <span className={`grid size-16 place-items-center rounded-[12px] border-2 text-[0.75em] tablet:size-20 ${gekozen ? "border-actie-blauw bg-blauw-zacht" : "border-rand-interactief text-[#6c7fbf]"}`} aria-hidden>
          {gekozen || "?"}
        </span>
        <Breuk teller={r1} noemer={r2} />
      </div>
      <fieldset className="mt-4" disabled={vergrendeld}>
        <legend className="sr-only">{vraag.instructie}</legend>
        <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
          {vraag.options.map((optie) => {
            const isGekozen = gekozen === optie;
            return (
              <label
                key={optie}
                className={`grid min-h-16 place-items-center rounded-[14px] border text-4xl font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                  isGekozen ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-rand-interactief bg-[#f5faff]"
                } ${vergrendeld ? "cursor-default" : "cursor-pointer [@media(hover:hover)]:hover:bg-blauw-zacht"}`}
              >
                <input
                  type="radio"
                  name={`antwoord-${groep}`}
                  value={optie}
                  checked={isGekozen}
                  onChange={() => onKies(optie)}
                  className="sr-only"
                  aria-label={optie === "<" ? "kleiner dan" : optie === ">" ? "groter dan" : "is gelijk aan"}
                />
                <span aria-hidden>{optie}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

function TafelOpgave({ vraag, waarde, onWijzig, vergrendeld, id }: { vraag: TafelVraag; waarde: string; onWijzig: (w: string) => void; vergrendeld: boolean; id: string }) {
  const veld = useRef<HTMLInputElement>(null);
  // Meteen klaar om te typen, maar zonder het gesprek te laten verspringen (de chat bepaalt zelf wat in beeld komt).
  useEffect(() => {
    if (!vergrendeld && !matchMedia("(pointer: coarse)").matches) veld.current?.focus({ preventScroll: true });
  }, [vergrendeld]);
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-[2.5rem] font-bold text-inkt tablet:text-[3rem]">
      <span aria-hidden>
        {vraag.links} {vraag.bewerking === "x" ? "×" : ":"} {vraag.rechts} =
      </span>
      <label htmlFor={`tafel-${id}`} className="sr-only">
        Antwoord op {vraag.links} {vraag.bewerking === "x" ? "keer" : "gedeeld door"} {vraag.rechts}
      </label>
      <input
        id={`tafel-${id}`}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={4}
        value={waarde}
        readOnly={vergrendeld}
        ref={veld}
        onChange={(e) => onWijzig(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
        className="h-16 w-28 rounded-[14px] border-2 border-rand-interactief bg-wit text-center focus:border-actie-blauw tablet:h-20 tablet:w-36"
      />
    </div>
  );
}

function Terugblik({ sessie, opslag, onNogEenRondje, onIetsAnders }: { sessie: Sessie; opslag: OpslagData; onNogEenRondje: () => void; onIetsAnders: () => void }) {
  const { zelfstandig, aantal } = sessieStatistiek(sessie);
  const metHulp = aantal - zelfstandig;
  const ontdekt = opslag.weetjes.find((w) => w.sessieId === sessie.id);
  const weetje = ontdekt ? vindWeetje(ontdekt.weetjeId) : null;
  const limietMs = sessie.soort === "tafels" && sessie.instellingen?.metTijd && sessie.instellingen.secondenPerVraag ? sessie.instellingen.secondenPerVraag * 1000 : null;
  const opTijd = limietMs
    ? sessie.slots.filter((sl) => opslag.pogingen.some((p) => p.sessieId === sessie.id && p.slotId === sl.id && p.resultaat === "goed" && (p.actieveDuurMs ?? Infinity) <= limietMs)).length
    : null;
  const basis =
    metHulp === 0
      ? `Klaar! Je hebt alle ${aantal} vragen zelf goed gedaan. Knap!`
      : `Klaar! Je hebt ${aantal} vragen gedaan: ${zelfstandig} helemaal zelf en ${metHulp} met hulp. Zo leer je erbij.`;
  const tekst = opTijd === null ? basis : `${basis} ${opTijd} van de ${sessie.slots.length} goed binnen de tijd.`;
  return (
    <div data-stap={`terugblik-${sessie.id}`} className="mees-verschijn w-full tablet:max-w-[92%] rounded-[20px] border-2 border-[#86d3a6] bg-wit px-5 py-5 shadow-[0_8px_24px_#92c5eb17] tablet:px-6">
      <MeesAfzender />
      <h3 className="mt-2 text-2xl font-extrabold">Goed gewerkt! 🎉</h3>
      <p className="mt-1 font-semibold text-tekst-zacht">{sessieNaam(sessie)}</p>
      <p className="mt-2 text-lg">{tekst}</p>
      {weetje && (
        <Link href={`/kind/weetjes/${weetje.id}`} className="mt-4 flex items-center gap-3 rounded-[14px] bg-blauw-zacht p-3 font-semibold hover:bg-[#d9ecfd]">
          <Icoon naam="weetjesboek" className="size-7 shrink-0 text-actie-blauw" />
          <span>
            Je hebt een nieuw weetje verdiend: <span className="font-bold">{weetje.titel}</span>
          </span>
        </Link>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onNogEenRondje} className={hoofdKnop}>
          Nog een rondje
        </button>
        <button type="button" onClick={onIetsAnders} className="inline-flex min-h-14 items-center rounded-[14px] border border-[#cfe6fb] bg-[#f3f9ff] px-5 font-bold hover:bg-blauw-zacht">
          Iets anders doen
        </button>
      </div>
      <div className="mt-2">
        <VoorleesLink id={`terugblik-${sessie.id}`} tekst={`Goed gewerkt! ${tekst}`} />
      </div>
    </div>
  );
}
