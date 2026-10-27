"use client";

import dynamic from "next/dynamic";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Breuk, TekstMetBreuken } from "@/components/mees/Breuk";
import { Icoon } from "@/components/mees/Icoon";
import { sessieStatistiek } from "@/features/oefenen/sessie";
import type { OpslagData, Sessie, Slot } from "@/features/oefenen/types";
import { sessieNaam } from "@/features/oefenen/weergave";
import { antwoordTekst, goedAntwoordTekst, vindVraag, type BreukVergelijkVraag, type TafelVraag, type Vraag } from "@/features/oefenen/vragen";
import { hintVoorleesTekst, uitlegVoorleesTekst, vraagVoorleesTekst } from "@/features/voorlezen/teksten";
import { useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";
import { MeesAfzender, VoorleesLink } from "./ChatVoorlezen";
import { NieuweReactie, TypOnthul } from "./ChatOnthul";
import { Puntjes } from "./ChatTypen";
import { isNetGehandeld, markeerActie, meesWacht, rustigeWeergave, useKaartKeuze, useMeesTypt, zetKaartKeuze, zetKlok } from "./ritme";

// De kaart van Europa is groot (alle landvormen): pas laden als er echt Europa geoefend wordt.
const kaartRuimte = () => <div className="mt-3 h-[clamp(260px,52dvh,560px)] animate-pulse rounded-[16px] bg-blauw-zacht tablet:h-[clamp(320px,58dvh,640px)]" aria-hidden />;
const EuropaOpgave = dynamic(() => import("./EuropaInChat").then((m) => m.EuropaOpgave), { ssr: false, loading: kaartRuimte });
const EuropaUitlegKaart = dynamic(() => import("./EuropaInChat").then((m) => m.EuropaUitlegKaart), { ssr: false, loading: kaartRuimte });
const PuzzelBlok = dynamic(() => import("./EuropaInChat").then((m) => m.PuzzelBlok), { ssr: false, loading: kaartRuimte });

const REACTIE_MS = 900;
const DAARNA_MS = 500;

/** Toont een nieuwe stap pas na een korte pauze; met puntjes van Mees als die stap een reactie van Mees is. */
function NaActie({ id, ms, puntjes, children }: { id: string; ms: number; puntjes: boolean; children: ReactNode }) {
  const [wacht, setWacht] = useState(() => isNetGehandeld() && !rustigeWeergave());
  // Onthouden dat er gewacht is: dan is dit een nieuwe reactie en typt Mees de inhoud.
  const [gewacht] = useState(wacht);
  // Een vervolg (de vraag opnieuw) wacht ook tot Mees klaar is met het typen van zijn reactie.
  const typt = useMeesTypt();
  useEffect(() => {
    if (!wacht) return;
    const t = setTimeout(() => setWacht(false), ms);
    return () => clearTimeout(t);
  }, [wacht, ms]);
  // Eenmaal getoond blijft het staan (ook als Mees later weer iets typt).
  const [getoond, setGetoond] = useState(false);
  const toon = getoond || (!wacht && !(gewacht && !puntjes && typt));
  if (toon && !getoond) setGetoond(true);
  // Zolang dit nog moet verschijnen, wachten de opties in de chatbalk.
  useEffect(() => (toon ? undefined : meesWacht()), [toon]);
  if (toon) return <NieuweReactie value={gewacht}>{children}</NieuweReactie>;
  if (!puntjes) return null;
  return (
    <div data-stap={id} className="w-full rounded-[20px] border border-[#e9f5ff] bg-wit px-5 py-4 shadow-[0_8px_24px_#92c5eb17] tablet:max-w-[92%]">
      <MeesAfzender />
      <Puntjes />
    </div>
  );
}
import type { OefenVerwijzing } from "./gesprek";
import { verloopVanSlot, type Hulp, type Stap } from "./oefen-verloop";

type BreukOfTafel = Vraag;

/**
 * Een oefening in het gesprek. Alle pogingen blijven staan; alleen de nieuwste vraag is interactief.
 * Antwoordcontrole, hulp en voortgang komen uit de oefenmotor (sessie.ts) en de lokale opslag.
 */
export function OefenBlok({ verwijzing, actief }: { verwijzing: OefenVerwijzing; actief: boolean }) {
  const opslag = useOpslag();
  const sessie = opslag?.sessies[verwijzing.sessieId];
  const [bewaarFout, setBewaarFout] = useState(false);
  if (!opslag || !sessie) return null;

  const eind = verwijzing.tot ?? Math.min(sessie.index + 1, sessie.slots.length);
  const interactief = actief && verwijzing.tot === undefined && sessie.status === "bezig";
  const bewaar = (w: (d: OpslagData) => OpslagData) => {
    markeerActie();
    setBewaarFout(!wijzigOpslag(w));
  };

  if (sessie.soort === "puzzel")
    return (
      <>
        {(sessie.status === "bezig" || verwijzing.tot !== undefined) && <PuzzelBlok sessie={sessie} interactief={interactief} bewaar={bewaar} />}
        {bewaarFout && <p className="rounded-[16px] bg-fout-zacht p-4 font-semibold text-fout">Bewaren lukt nu niet. Sluit dit scherm nog niet.</p>}
        {actief && verwijzing.tot === undefined && sessie.status === "afgerond" && (
          <NaActie id={`terugblik-${sessie.id}`} ms={REACTIE_MS} puntjes>
            <Terugblik sessie={sessie} opslag={opslag} />
          </NaActie>
        )}
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
          />
        );
      })}
      {bewaarFout && <p className="rounded-[16px] bg-fout-zacht p-4 font-semibold text-fout">Bewaren lukt nu niet. Sluit dit scherm nog niet.</p>}
      {actief && verwijzing.tot === undefined && sessie.status === "afgerond" && (
          <NaActie id={`terugblik-${sessie.id}`} ms={REACTIE_MS} puntjes>
            <Terugblik sessie={sessie} opslag={opslag} />
          </NaActie>
        )}
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
}: {
  sessie: Sessie;
  slot: Slot;
  vraag: BreukOfTafel;
  nummer: number;
  pogingen: Parameters<typeof verloopVanSlot>[1];
  interactief: boolean;
}) {
  const stappen = verloopVanSlot(slot, pogingen);
  const laatsteVraag = stappen.findLastIndex((s) => s.soort === "vraag");
  const sleutel = (s: Stap, i: number) => `${slot.id}-${i}-${s.soort}`;

  return (
    <>
      {stappen.map((stap, i) => {
        const id = sleutel(stap, i);
        const inhoud = (() => {
          switch (stap.soort) {
            case "vraag":
              return (
                <Fragment key={id}>
                  <VraagKaart
                    id={id}
                    slotId={slot.id}
                    vraag={vraag}
                    sessie={sessie}
                    opties={vraag.soort === "europa" ? (vraag.opties ?? slot.opties ?? []) : []}
                    nummer={nummer}
                    herhaling={Boolean(slot.herhalingVan)}
                    stap={stap}
                    interactief={interactief && stap.status === "open" && i === laatsteVraag}
                    seconden={sessie.soort === "tafels" && sessie.instellingen?.metTijd ? (sessie.instellingen.secondenPerVraag ?? null) : null}
                  />
                  {/* Het antwoord van het kind, als eigen chatbericht onder de vraag. */}
                  {stap.antwoord && (
                    <div data-stap={`${id}-antwoord`} className="ml-auto max-w-[85%] rounded-[20px] bg-[#e0f2ff] px-5 py-3.5 text-lg">
                      <span className="sr-only">Jij: </span>
                      {antwoordWoorden(vraag, stap.antwoord)}
                    </div>
                  )}
                </Fragment>
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
                </Kaart>
              );
            case "verder":
              // Na de uitleg: bij een kaartvraag de goede plek op de kaart. Verder gaat via de chatbalk.
              return interactief && vraag.soort === "europa" && vraag.type === "map-click" ? (
                <div key={id} data-stap={id} className="w-full tablet:max-w-[92%]">
                  <EuropaUitlegKaart vraag={vraag} sessie={sessie} />
                </div>
              ) : null;
          }
        })();
        if (!inhoud) return null;
        // Reactie van Mees (feedback, hint): eerst puntjes. Een nieuwe of herhaalde vraag komt daarna.
        const reactie = stap.soort === "fout" || stap.soort === "goed" || stap.soort === "hulp";
        const vervolg = (stap.soort === "vraag" && stap.status === "open") || stap.soort === "verder";
        if (!reactie && !vervolg) return inhoud;
        return (
          <NaActie key={id} id={id} ms={reactie || i === 0 ? REACTIE_MS : REACTIE_MS + DAARNA_MS} puntjes={reactie || i === 0}>
            {inhoud}
          </NaActie>
        );
      })}
    </>
  );
}

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
      <TypOnthul className="mt-2">
        {children}
        <div className="mt-2">
          <VoorleesLink id={voorlees.id} tekst={voorlees.tekst} />
        </div>
      </TypOnthul>
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

/** De vraag als bericht van Mees. Antwoorden gaat via de chatbalk; alleen bij "Waar ligt …?" tik je op de kaart. */
function VraagKaart({
  id,
  slotId,
  vraag,
  sessie,
  opties,
  nummer,
  herhaling,
  stap,
  interactief,
  seconden,
}: {
  id: string;
  slotId: string;
  vraag: BreukOfTafel;
  sessie: Sessie;
  opties: { id: string; label: string }[];
  nummer: number;
  herhaling: boolean;
  stap: Extract<Stap, { soort: "vraag" }>;
  interactief: boolean;
  /** Tafels op tijd: seconden per vraag (afteller). */
  seconden?: number | null;
}) {
  const tijd = useActieveTijd(interactief && vraag.soort === "tafel");
  const kaartKeuze = useKaartKeuze();
  const titel = stap.opnieuw ? "Probeer het nog eens." : herhaling ? "Nog een soortgelijke vraag." : `Vraag ${nummer}`;
  // De chatbalk leest de antwoordtijd af als het kind antwoordt.
  const leesTijd = tijd.ms;
  useEffect(() => {
    if (!interactief || vraag.soort !== "tafel") return;
    zetKlok(leesTijd);
    return () => zetKlok(null);
  }, [interactief, vraag.soort, leesTijd]);

  return (
    <div data-stap={id} className={`w-full tablet:max-w-[92%] rounded-[20px] border border-[#e9f5ff] bg-wit px-5 py-4 shadow-[0_8px_24px_#92c5eb17] tablet:px-6 ${interactief ? "" : "opacity-90"}`}>
      <MeesAfzender />
      <p className="mt-2 font-semibold text-actie-blauw">{titel}</p>
      <h3 className="mt-1 text-xl font-extrabold tablet:text-2xl">{vraag.prompt}</h3>
      {vraag.soort !== "tafel" && <p className="mt-1 text-[#5b6fae]">{vraag.soort === "breuk" ? "Kies het teken onderin, of typ het." : vraag.instructie}</p>}
      {interactief && seconden ? <Afteller resterendMs={Math.max(0, seconden * 1000 - tijd.nu)} totaalMs={seconden * 1000} /> : null}

      {vraag.soort === "breuk" ? (
        <BreukOpgave vraag={vraag} />
      ) : vraag.soort === "tafel" ? (
        <TafelOpgave vraag={vraag} />
      ) : interactief ? (
        // Europa: alleen de open vraag krijgt een kaart; eerdere pogingen staan als tekst.
        <EuropaOpgave
          vraag={vraag}
          sessie={sessie}
          opties={opties}
          gekozen={kaartKeuze?.slotId === slotId ? kaartKeuze.id : ""}
          onKies={(plek) => zetKaartKeuze({ slotId, id: plek })}
        />
      ) : null}
      {interactief && vraag.soort === "tafel" && <p className="mt-3 text-center text-[#5b6fae]">Typ je antwoord onderin.</p>}
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

function BreukOpgave({ vraag }: { vraag: BreukVergelijkVraag }) {
  const [l1, l2] = vraag.visual.links;
  const [r1, r2] = vraag.visual.rechts;
  return (
    <div className="mt-4 flex items-center justify-center gap-5 text-[2.75rem] font-bold text-inkt tablet:gap-8 tablet:text-[3.25rem]" role="group" aria-label={`Breuk ${l1}/${l2} en breuk ${r1}/${r2}`}>
      <Breuk teller={l1} noemer={l2} />
      <span className="grid size-16 place-items-center rounded-[12px] border-2 border-rand-interactief text-[0.75em] text-[#6c7fbf] tablet:size-20" aria-hidden>
        ?
      </span>
      <Breuk teller={r1} noemer={r2} />
    </div>
  );
}

function TafelOpgave({ vraag }: { vraag: TafelVraag }) {
  return (
    <p className="mt-4 text-center text-[2.5rem] font-bold text-inkt tablet:text-[3rem]" aria-label={`${vraag.links} ${vraag.bewerking === "x" ? "keer" : "gedeeld door"} ${vraag.rechts}`}>
      <span aria-hidden>
        {vraag.links} {vraag.bewerking === "x" ? "×" : ":"} {vraag.rechts} = ?
      </span>
    </p>
  );
}

function Terugblik({ sessie, opslag }: { sessie: Sessie; opslag: OpslagData }) {
  const { zelfstandig, aantal } = sessieStatistiek(sessie);
  const metHulp = aantal - zelfstandig;
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
      <TypOnthul>
        <h3 className="mt-2 text-2xl font-extrabold">Goed gewerkt! 🎉</h3>
        <p className="mt-1 font-semibold text-tekst-zacht">{sessieNaam(sessie)}</p>
        <p className="mt-2 text-lg">{tekst}</p>
        <div className="mt-2">
          <VoorleesLink id={`terugblik-${sessie.id}`} tekst={`Goed gewerkt! ${tekst}`} />
        </div>
      </TypOnthul>
    </div>
  );
}
