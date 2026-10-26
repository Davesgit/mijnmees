"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { vindOnderdeelBijLeerdoel } from "@/content/onderwerpen";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { useProfiel } from "@/components/mees/Profiel";
import { useVoorlezen } from "@/components/mees/Voorlezen";
import { gastLimietBereikt, maakSessie, oefenConfig, openSessie, rondOvergangAf, sessieRoute } from "@/features/oefenen/sessie";
import { sessieNaam } from "@/features/oefenen/weergave";
import { haalOpslag, useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";
import { antwoord, maakTitel, reageer, startkaarten, type Bericht, type Context, type Gesprek, type Keuze, type Onderwerp } from "./gesprek";
import { bewaar, useChats } from "./opslag";

const STANDAARD_DOEL = "breuken-vergelijken";
const kaartIcoon: Record<(typeof startkaarten)[number]["onderwerp"], AlleIcoonNamen> = { leren: "boek", oefenen: "herhaal", vraag: "chat" };

/** Keuzes onder "Veel plezier!": handig als het kind na het oefenen terugkomt in het gesprek. */
const naTerugkomst: Keuze[] = [
  { label: "Verder oefenen", soort: "vervolg", onderwerp: "oefenen" },
  { label: "Iets leren", soort: "vervolg", onderwerp: "leren" },
  { label: "Mijn voortgang", soort: "ga", href: "/kind/voortgang" },
];

const nieuwId = () => crypto.randomUUID();
const bericht = (van: Bericht["van"], tekst: string, keuzes?: Keuze[]): Bericht => ({ id: nieuwId(), van, tekst, keuzes, t: Date.now() });

/** Voegt berichten toe aan het actieve gesprek (of begint een nieuw gesprek). */
function voegToeAan(gesprek: Gesprek | null, nieuw: Bericht[], titelBron?: string) {
  const basis: Gesprek = gesprek ?? { id: nieuwId(), titel: maakTitel(titelBron ?? nieuw[0]?.tekst ?? ""), berichten: [], bijgewerkt: Date.now() };
  bewaar({ ...basis, berichten: [...basis.berichten, ...nieuw], bijgewerkt: Date.now() });
}

/** De chat met Mees: de hoofdingang voor kinderen (ontwerp versie 6). `meldingen` staan op het welkomstscherm. */
export function ChatScherm({ meldingen }: { meldingen?: ReactNode }) {
  const router = useRouter();
  const { kind } = useProfiel();
  const opslag = useOpslag();
  const chats = useChats();
  const [invoer, setInvoer] = useState("");
  const [navigeert, startNavigatie] = useTransition();
  const voorlezen = useVoorlezen();
  const [leestId, setLeestId] = useState<string | null>(null);
  const eindeRef = useRef<HTMLDivElement>(null);

  const gesprek = chats?.actief ? (chats.gesprekken.find((g) => g.id === chats.actief) ?? null) : null;
  const aantalBerichten = gesprek?.berichten.length ?? 0;

  // Nieuwste bericht in beeld (ook bij terugkomen in een gesprek).
  useEffect(() => {
    if (aantalBerichten > 0) eindeRef.current?.scrollIntoView({ block: "end" });
  }, [aantalBerichten, gesprek?.id]);

  // Voorlezen stopt bij een andere chat.
  const gesprekId = gesprek?.id;
  useEffect(() => () => voorlezen.stop(), [gesprekId]); // eslint-disable-line react-hooks/exhaustive-deps

  function context(): Context {
    const data = haalOpslag();
    const open = openSessie(data);
    const voorstel = vindOnderdeelBijLeerdoel(data.reviews[0]?.leerdoelId ?? STANDAARD_DOEL) ?? vindOnderdeelBijLeerdoel(STANDAARD_DOEL)!;
    return { open: open ? sessieNaam(open) : null, voorstel: voorstel.onderdeel.naam, aantal: oefenConfig.standaardAantal };
  }

  const voegToe = (nieuw: Bericht[], titelBron?: string) => voegToeAan(gesprek, nieuw, titelBron);

  function stuur(tekst: string, onderwerp?: Onderwerp, titel?: string) {
    const schoon = tekst.trim().slice(0, 500);
    if (!schoon) return;
    stopVoorlezen();
    const reactie = onderwerp ? antwoord(onderwerp, context()) : reageer(schoon, context());
    voegToe([bericht("kind", schoon), bericht("mees", reactie.tekst, reactie.keuzes)], titel);
    setInvoer("");
  }

  function kies(k: Keuze) {
    stopVoorlezen();
    if (k.soort === "vervolg") {
      const reactie = antwoord(k.onderwerp, context());
      voegToe([bericht("kind", k.label), bericht("mees", reactie.tekst, reactie.keuzes)]);
      return;
    }
    let doel: string | null = null;
    if (k.soort === "ga") doel = k.href;
    if (k.soort === "hervat") {
      const open = openSessie(haalOpslag());
      if (open) {
        wijzigOpslag((d) => rondOvergangAf(d, open.id));
        const bijgewerkt = haalOpslag().sessies[open.id];
        if (bijgewerkt) doel = sessieRoute(bijgewerkt);
      }
    }
    if (k.soort === "voorstel") doel = startVoorstel();
    if (!doel) {
      voegToe([bericht("kind", k.label), bericht("mees", "Dat lukt nu even niet. Probeer het nog eens, of kies iets anders.")]);
      return;
    }
    voegToe([bericht("kind", k.label), bericht("mees", "Veel plezier! Als je terugkomt, praten we hier verder.", naTerugkomst)]);
    const href = doel;
    startNavigatie(() => router.push(href));
  }

  /** Start het voorstel (zelfde logica als het oude startscherm). Geeft de route terug, of null. */
  function startVoorstel(): string | null {
    if (!kind && gastLimietBereikt(haalOpslag())) return "/voortgang-bewaren";
    const data = haalOpslag();
    const voorstel = vindOnderdeelBijLeerdoel(data.reviews[0]?.leerdoelId ?? STANDAARD_DOEL) ?? vindOnderdeelBijLeerdoel(STANDAARD_DOEL)!;
    let sessieId = "";
    wijzigOpslag((d) => {
      const r = maakSessie(d, {
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
    return sessieId ? `/kind/oefenen/${sessieId}` : null;
  }

  function leesVoor(b: Bericht) {
    if (leestId === b.id && voorlezen.bezig) return stopVoorlezen();
    setLeestId(b.id);
    void voorlezen.start(b.tekst);
  }
  function stopVoorlezen() {
    voorlezen.stop();
    setLeestId(null);
  }

  const invoerVeld = (
    <Invoer
      waarde={invoer}
      onWijzig={setInvoer}
      onStuur={() => stuur(invoer)}
      onLuisteren={stopVoorlezen}
      plaatshouder={gesprek ? "Stel een vervolgvraag…" : "Praat met Mees of typ je vraag…"}
    />
  );

  // Eerste weergave: nog onbekend of er een gesprek openstaat.
  if (chats === null || opslag === null) return <div className="flex-1 bg-[#f5fbff]" aria-hidden />;

  if (!gesprek) {
    return (
      <div className="chat-achtergrond flex flex-1 flex-col items-center justify-center px-4 py-8 tablet:px-[7%] tablet:py-12">
        <section className="w-full text-center">
          <div className="relative mx-auto mb-4 w-40 tablet:mb-5 tablet:w-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/merk/mees-vogel.svg" alt="" className="mx-auto h-28 w-auto tablet:h-36" />
            <span aria-hidden className="absolute -right-1 top-0 flex rotate-[-12deg] flex-col gap-2 tablet:-right-4">
              <span className="h-[3px] w-6 origin-left -rotate-30 rounded-full bg-[#80c6ff]" />
              <span className="h-[3px] w-7 rounded-full bg-[#80c6ff]" />
              <span className="h-[3px] w-6 origin-left rotate-30 rounded-full bg-[#80c6ff]" />
            </span>
          </div>
          <h1 className="text-[2.25rem] font-extrabold leading-tight tracking-tight tablet:text-[3.375rem]">
            {kind ? `Hoi ${kind.voornaam}!` : "Hoi!"} <span className="text-[0.85em]">👋</span>
          </h1>
          <p className="mt-2 text-xl font-semibold text-[#5e6fa8] tablet:text-[1.6875rem]">Waar kan ik je vandaag mee helpen?</p>
        </section>

        <div className="mt-6 w-full max-w-[1030px] tablet:mt-8">
          <div className="mx-auto tablet:w-[90%]">{invoerVeld}</div>
          <div className="mt-5 grid gap-3 tablet:gap-4 min-[1200px]:grid-cols-3 min-[1200px]:gap-5">
            {startkaarten.map((k) => (
              <button
                key={k.onderwerp}
                type="button"
                onClick={() => stuur(k.kindTekst, k.onderwerp, k.titel)}
                className="flex items-center gap-4 rounded-[24px] border border-[#e9f5ff] bg-wit/95 p-5 text-left shadow-[0_8px_24px_#92c5eb21] hover:bg-[#f1f9ff] tablet:gap-5 tablet:p-6"
              >
                <Icoon naam={kaartIcoon[k.onderwerp]} className="size-10 shrink-0 text-actie-blauw" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.0625rem] font-bold">{k.titel}</span>
                  <span className="mt-1 block text-[0.9375rem] text-[#5e6fa8]">{k.tekst}</span>
                </span>
                <Icoon naam="chevron-rechts" className="size-7 shrink-0 text-[#5366a5]" />
              </button>
            ))}
          </div>
          {meldingen && <div className="mt-6 flex flex-col gap-3">{meldingen}</div>}
        </div>
      </div>
    );
  }

  const laatsteMees = [...gesprek.berichten].reverse().find((b) => b.van === "mees")?.id;

  return (
    <div className="chat-achtergrond flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-4 pt-6 tablet:px-8 tablet:pt-10">
        <h1 className="truncate text-xl font-extrabold tablet:text-2xl">{gesprek.titel}</h1>
        <div role="log" aria-live="polite" aria-label="Gesprek met Mees" className="mt-4 flex flex-col gap-3 pb-6">
          {gesprek.berichten.map((b) =>
            b.van === "kind" ? (
              <div key={b.id} className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] bg-[#e0f2ff] px-5 py-3.5 text-lg">
                <span className="sr-only">Jij: </span>
                {b.tekst}
              </div>
            ) : (
              <MeesBericht
                key={b.id}
                bericht={b}
                actief={b.id === laatsteMees}
                bezig={navigeert}
                leest={leestId === b.id && voorlezen.bezig}
                laadt={leestId === b.id && voorlezen.status === "laden"}
                onLees={() => leesVoor(b)}
                onKies={kies}
              />
            ),
          )}
          <div ref={eindeRef} className="scroll-mb-32 tablet:scroll-mb-40" />
        </div>
      </div>
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-[#f5fbff] via-[#f5fbff]/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 tablet:px-8">
        <div className="mx-auto max-w-[860px]">{invoerVeld}</div>
      </div>
    </div>
  );
}

function MeesBericht({
  bericht: b,
  actief,
  bezig,
  leest,
  laadt,
  onLees,
  onKies,
}: {
  bericht: Bericht;
  actief: boolean;
  bezig: boolean;
  leest: boolean;
  laadt: boolean;
  onLees: () => void;
  onKies: (k: Keuze) => void;
}) {
  return (
    <div className="max-w-[92%] rounded-[20px] border border-[#e9f5ff] bg-wit px-5 py-4 shadow-[0_8px_24px_#92c5eb17]">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-blauw-zacht" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/merk/mees-vogel.svg" alt="" className="h-5 w-auto" />
        </span>
        <strong className="tekst-klein">Mees</strong>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-lg leading-relaxed">{b.tekst}</p>
      {actief && b.keuzes && b.keuzes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {b.keuzes.map((k) => (
            <button
              key={k.label}
              type="button"
              disabled={bezig}
              onClick={() => onKies(k)}
              className={`min-h-12 rounded-[14px] border px-4 font-semibold disabled:opacity-60 ${
                k.soort === "voorstel" || k.soort === "hervat" ? "border-actie-blauw bg-actie-blauw text-wit hover:bg-[#004fa8]" : "border-[#cfe6fb] bg-[#f3f9ff] text-inkt hover:border-actie-blauw hover:bg-blauw-zacht"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onLees}
        aria-pressed={leest}
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-[10px] px-2 tekst-klein font-semibold text-actie-blauw hover:bg-blauw-zacht"
      >
        <Icoon naam={leest ? "stop" : "voorlezen"} className={`size-5 ${laadt ? "animate-pulse" : ""}`} />
        {laadt ? "Even laden…" : leest ? "Stoppen" : "Voorlezen"}
      </button>
    </div>
  );
}

// Inspreken via de spraakherkenning van de browser: alleen na een tik, tekst komt ter controle in het invoerveld.
type Herkenning = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onstart: (() => void) | null;
};
type HerkenningKlasse = new () => Herkenning;
const herkenningKlasse = () => {
  const w = window as unknown as { SpeechRecognition?: HerkenningKlasse; webkitSpeechRecognition?: HerkenningKlasse };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};
const geenAbonnement = () => () => {};

function Invoer({ waarde, onWijzig, onStuur, onLuisteren, plaatshouder }: { waarde: string; onWijzig: (t: string) => void; onStuur: () => void; onLuisteren: () => void; plaatshouder: string }) {
  const kanPraten = useSyncExternalStore(geenAbonnement, () => herkenningKlasse() !== null, () => false);
  const smal = useSyncExternalStore(geenAbonnement, () => matchMedia("(max-width: 767px)").matches, () => false);
  const [luistert, setLuistert] = useState(false);
  const [melding, setMelding] = useState("");
  const herkenning = useRef<Herkenning | null>(null);
  const veld = useRef<HTMLInputElement>(null);

  useEffect(() => () => herkenning.current?.abort(), []);

  function praat() {
    if (luistert) {
      herkenning.current?.stop();
      return;
    }
    const Klasse = herkenningKlasse();
    if (!Klasse) return;
    onLuisteren();
    setMelding("");
    const h = new Klasse();
    h.lang = "nl-NL";
    h.interimResults = true;
    h.continuous = false;
    h.onstart = () => setLuistert(true);
    h.onresult = (e) => {
      const tekst = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join("");
      onWijzig(tekst);
    };
    h.onerror = (e) => setMelding(e.error === "not-allowed" || e.error === "service-not-allowed" ? "De microfoon mag niet gebruikt worden. Je kunt ook typen." : "Ik kon je niet goed horen. Probeer het nog eens of typ je vraag.");
    h.onend = () => {
      setLuistert(false);
      veld.current?.focus();
    };
    herkenning.current = h;
    try {
      h.start();
    } catch {
      setMelding("Praten lukt nu niet. Je kunt ook typen.");
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onStuur();
        }}
        className={`flex items-center gap-2 rounded-full bg-wit/95 p-2 shadow-[0_7px_28px_#69b5ec26] tablet:gap-3 tablet:p-3 ${luistert ? "ring-2 ring-actie-blauw" : ""}`}
      >
        {kanPraten && (
          <button
            type="button"
            onClick={praat}
            aria-pressed={luistert}
            aria-label={luistert ? "Stop met luisteren" : "Vraag inspreken"}
            className={`grid size-12 shrink-0 place-items-center rounded-full tablet:size-16 ${luistert ? "bg-actie-blauw text-wit" : "bg-[#e4f5ff] text-actie-blauw hover:bg-[#d4eeff]"}`}
          >
            <Icoon naam={luistert ? "stop" : "microfoon"} className="size-6 tablet:size-7" />
          </button>
        )}
        <label htmlFor="chat-invoer" className="sr-only">
          Je vraag aan Mees
        </label>
        <input
          ref={veld}
          id="chat-invoer"
          value={waarde}
          onChange={(e) => onWijzig(e.target.value)}
          maxLength={500}
          autoComplete="off"
          enterKeyHint="send"
          placeholder={luistert ? "Mees luistert…" : smal ? "Typ je vraag…" : plaatshouder}
          className="min-w-0 flex-1 rounded-full border border-[#edf7ff] bg-transparent px-4 py-3 text-lg placeholder:text-[#6f7db0] tablet:px-5 tablet:py-4 tablet:text-xl"
        />
        <button type="submit" aria-label="Verstuur je vraag" disabled={!waarde.trim()} className="grid size-12 shrink-0 place-items-center rounded-full bg-actie-blauw text-wit hover:bg-[#004fa8] disabled:opacity-50 tablet:size-16">
          <Icoon naam="verstuur" className="size-6 tablet:size-7" />
        </button>
      </form>
      <p role="status" className="mt-2 min-h-5 px-4 tekst-klein text-[#52649b]">
        {luistert ? "Mees luistert… Tik op stop als je klaar bent." : melding}
      </p>
    </div>
  );
}
