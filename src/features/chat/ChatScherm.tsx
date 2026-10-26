"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { vindOnderdeel } from "@/content/onderwerpen";
import { vindWeetje } from "@/content/weetjes";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { useProfiel } from "@/components/mees/Profiel";
import { useVoorlezen } from "@/components/mees/Voorlezen";
import { gastLimietBereikt, maakSessie, maakTafelSessie, openSessie, rondOvergangAf, sessieRoute } from "@/features/oefenen/sessie";
import type { OpslagData } from "@/features/oefenen/types";
import { sessieNaam } from "@/features/oefenen/weergave";
import { weetjeVoorleesTekst } from "@/features/voorlezen/teksten";
import { haalOpslag, useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";
import { Invoer } from "./ChatInvoer";
import { TafelKaart, VoorstelKaart, voorstelOpties, VoortgangKaart, WeetjeKaart, WeetjesKaart, type TafelInstelling } from "./ChatKaarten";
import { ChatVoorleesContext, MeesAfzender, VoorleesLink } from "./ChatVoorlezen";
import { antwoord, reageer, startkaarten, type Antwoord, type Context, type Kaart, type Keuze, type Onderwerp } from "./gesprek";
import { OefenBlok } from "./OefenBlok";
import { kanInChat, oefenTeller, STANDAARD_AANTAL } from "./oefen-verloop";
import { maakBericht as bericht, useChats, voegToeAanActief } from "./opslag";
const kaartIcoon: Record<(typeof startkaarten)[number]["onderwerp"], AlleIcoonNamen> = { leren: "boek", oefenen: "herhaal", vraag: "chat" };

/** Keuzes onder "Veel plezier!": handig als het kind na het oefenen terugkomt in het gesprek. */
const naTerugkomst: Keuze[] = [
  { label: "Verder oefenen", soort: "vervolg", onderwerp: "oefenen" },
  { label: "Iets leren", soort: "vervolg", onderwerp: "leren" },
  { label: "Mijn voortgang", soort: "ga", href: "/kind/voortgang" },
];

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
  const laatste = gesprek?.berichten.at(-1);
  const actieveOefening = laatste?.oefening && laatste.oefening.tot === undefined ? opslag?.sessies[laatste.oefening.sessieId] : undefined;
  const oefentBezig = actieveOefening?.status === "bezig";
  // Verandert bij elke stap in de oefening: dan het nieuwste deel in beeld brengen.
  const stand = `${gesprek?.id}-${gesprek?.berichten.length}-${actieveOefening?.versie}-${actieveOefening?.status}-${opslag?.pogingen.length}`;

  useEffect(() => {
    if (gesprek) eindeRef.current?.scrollIntoView({ block: "end" });
  }, [stand]); // eslint-disable-line react-hooks/exhaustive-deps

  // Voorlezen stopt bij een andere chat.
  const gesprekId = gesprek?.id;
  useEffect(() => () => voorlezen.stop(), [gesprekId]); // eslint-disable-line react-hooks/exhaustive-deps

  function context(): Context {
    const data = haalOpslag();
    const open = openSessie(data);
    const v = voorstelOpties(data)[0]!;
    return { open: open ? sessieNaam(open) : null, voorstel: v.naam, voorstelId: v.id, aantal: STANDAARD_AANTAL };
  }

  const voegToe = voegToeAanActief;
  const meesZegt = (r: Antwoord) => bericht("mees", r.tekst, { keuzes: r.keuzes, kaart: r.kaart });

  function stuur(tekst: string, onderwerp?: Onderwerp, titel?: string) {
    const schoon = tekst.trim().slice(0, 500);
    if (!schoon) return;
    stopVoorlezen();
    const reactie = onderwerp ? antwoord(onderwerp, context()) : reageer(schoon, context());
    voegToe([bericht("kind", schoon), meesZegt(reactie)], { titel });
    setInvoer("");
  }

  function kies(k: Keuze) {
    stopVoorlezen();
    if (k.soort === "vervolg") {
      const reactie = antwoord(k.onderwerp, context());
      voegToe([bericht("kind", k.label), meesZegt(reactie)]);
      return;
    }
    if (k.soort === "kaart") {
      voegToe([bericht("kind", k.label), bericht("mees", k.tekst, { kaart: k.kaart })]);
      return;
    }
    if (k.soort === "voorstel") {
      voegToe([bericht("kind", k.label), bericht("mees", "Zullen we een klein rondje oefenen? Kies wat je wilt doen en hoeveel vragen.", { kaart: { soort: "voorstel", standaard: voorstelOpties(haalOpslag())[0]!.id } })]);
      return;
    }
    if (k.soort === "hervat") {
      const open = openSessie(haalOpslag());
      if (open && kanInChat(open)) {
        wijzigOpslag((d) => rondOvergangAf(d, open.id));
        const index = haalOpslag().sessies[open.id]?.index ?? open.index;
        voegToe([bericht("kind", k.label), bericht("mees", `We gaan verder met ${sessieNaam(open)}.`), bericht("mees", "", { oefening: { sessieId: open.id, vanaf: index } })], {
          sluitSessie: { id: open.id, tot: index },
        });
        return;
      }
      if (open) {
        wijzigOpslag((d) => rondOvergangAf(d, open.id));
        const bijgewerkt = haalOpslag().sessies[open.id];
        if (bijgewerkt) return ga(k.label, sessieRoute(bijgewerkt));
      }
      voegToe([bericht("kind", k.label), bericht("mees", "Er staat geen oefening meer open. Zullen we iets nieuws doen?", { keuzes: naTerugkomst })]);
      return;
    }
    ga(k.label, k.href);
  }

  function ga(label: string, href: string) {
    voegToe([bericht("kind", label), bericht("mees", "Veel plezier! Als je terugkomt, praten we hier verder.", { keuzes: naTerugkomst })]);
    startNavigatie(() => router.push(href));
  }

  /** Start een rondje in het gesprek: rekenen (voorstel) of tafels. */
  function startRondje(maak: (d: OpslagData) => { data: OpslagData; sessie: { id: string } } | null, label: string) {
    stopVoorlezen();
    const data = haalOpslag();
    if (!kind && gastLimietBereikt(data)) {
      voegToe([
        bericht("kind", label),
        bericht("mees", "Je hebt als gast al een paar rondjes gedaan. Vraag je ouder om een gratis account, dan bewaar je je voortgang en kun je verder oefenen.", {
          keuzes: [{ label: "Voortgang bewaren", soort: "ga", href: "/voortgang-bewaren" }],
        }),
      ]);
      return;
    }
    let sessieId = "";
    const gelukt = wijzigOpslag((d) => {
      try {
        const r = maak(d);
        if (!r) return d;
        sessieId = r.sessie.id;
        return r.data;
      } catch {
        return d;
      }
    });
    if (!sessieId) {
      voegToe([bericht("kind", label), bericht("mees", "Dat lukt nu even niet. Probeer het nog eens, of kies iets anders.", { keuzes: naTerugkomst })]);
      return;
    }
    voegToe([
      bericht("kind", label),
      bericht("mees", gelukt ? "Fijn! Neem rustig de tijd. Je kunt altijd een hint vragen." : "Fijn! Let op: bewaren lukt nu niet in deze browser."),
      bericht("mees", "", { oefening: { sessieId, vanaf: 0 } }),
    ]);
  }

  function startVoorstel(keuze: string, aantal: number, label: string) {
    startRondje((d) => {
      const o = vindOnderdeel(keuze.replace(/^doel:/, ""));
      if (!o?.onderdeel.leerdoelId) return null;
      return maakSessie(d, { leerdoelId: o.onderdeel.leerdoelId, onderdeelId: o.onderdeel.id, onderwerpId: o.onderwerp.id, niveau: "past-bij-mij", aantal, bron: "voorstel" });
    }, label);
  }

  function startTafels(i: TafelInstelling, label: string) {
    startRondje((d) => maakTafelSessie(d, { tafels: i.tafels, bewerkingen: i.bewerkingen, aantal: i.aantal, metTijd: i.metTijd, secondenPerVraag: i.seconden, bron: "zelf" }), label);
  }

  function pauze() {
    if (!actieveOefening || !laatste?.oefening) return;
    stopVoorlezen();
    voegToe(
      [
        bericht("kind", "Even pauze."),
        bericht("mees", "Prima, we nemen even pauze. Je oefening blijft bewaard. Kom terug wanneer je wilt.", {
          keuzes: [{ label: "Verder waar ik was", soort: "hervat" }, ...naTerugkomst.slice(1)],
        }),
      ],
      { sluitSessie: { id: actieveOefening.id, tot: actieveOefening.index } },
    );
  }

  function nogEenRondje() {
    const sessie = actieveOefening ?? (laatste?.oefening ? haalOpslag().sessies[laatste.oefening.sessieId] : undefined);
    if (sessie?.soort === "tafels")
      voegToe([bericht("kind", "Nog een rondje!"), bericht("mees", "Leuk! Welke tafels wil je nu doen?", { kaart: { soort: "tafels", tafels: sessie.instellingen?.tafels ?? [] } })]);
    else voegToe([bericht("kind", "Nog een rondje!"), bericht("mees", "Leuk! Kies wat je wilt doen en hoeveel vragen.", { kaart: { soort: "voorstel", standaard: voorstelOpties(haalOpslag())[0]!.id } })]);
  }

  function ietsAnders() {
    voegToe([bericht("kind", "Iets anders doen."), meesZegt(antwoord("leren", context()))]);
  }

  function lees(id: string, tekst: string) {
    if (leestId === id && voorlezen.bezig) return stopVoorlezen();
    setLeestId(id);
    void voorlezen.start(tekst);
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

  const voorleesWaarde = { leestId, bezig: voorlezen.bezig, laadt: voorlezen.status === "laden", lees };

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

  const laatsteMees = gesprek.berichten.findLast((b) => b.van === "mees" && !b.oefening)?.id;
  const teller = actieveOefening && oefentBezig ? oefenTeller(actieveOefening) : null;

  return (
    <ChatVoorleesContext value={voorleesWaarde}>
      <div className="chat-achtergrond flex flex-1 flex-col">
        {teller && actieveOefening && (
          <div className="sticky top-14 z-20 border-b border-[#e1f1fe] bg-[#f5fbff]/95 backdrop-blur tablet:top-0">
            <div className="mx-auto flex max-w-[860px] items-center gap-4 px-4 py-2.5 tablet:px-8">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  Vraag {teller.nummer} van {teller.totaal} <span className="font-semibold text-tekst-zacht">· {sessieNaam(actieveOefening)}</span>
                </p>
                <p className="tekst-klein text-tekst-zacht">
                  {teller.klaar} klaar · Nog {teller.nogTeDoen} te doen
                </p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#dcebf8]" role="progressbar" aria-label="Voortgang" aria-valuemin={0} aria-valuemax={teller.totaal} aria-valuenow={teller.klaar}>
                  <div className="h-full rounded-full bg-merk-blauw transition-[width] duration-300" style={{ width: `${(teller.klaar / teller.totaal) * 100}%` }} />
                </div>
              </div>
              <button type="button" onClick={pauze} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border border-[#cfe6fb] bg-wit px-4 font-semibold capitalize hover:bg-blauw-zacht tablet:normal-case">
                <Icoon naam="pauze" className="size-5" />
                <span>
                  <span className="max-tablet:hidden">Even </span>pauze
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-4 pt-6 tablet:px-8 tablet:pt-10">
          <h1 className="truncate text-xl font-extrabold tablet:text-2xl">{gesprek.titel}</h1>
          <div role="log" aria-live="polite" aria-label="Gesprek met Mees" className="mt-4 flex flex-col gap-3 pb-6">
            {gesprek.berichten.map((b) => {
              const isLaatste = b.id === laatste?.id;
              if (b.oefening) return <OefenBlok key={b.id} verwijzing={b.oefening} actief={isLaatste} onNogEenRondje={nogEenRondje} onIetsAnders={ietsAnders} />;
              if (b.van === "kind")
                return (
                  <div key={b.id} className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] bg-[#e0f2ff] px-5 py-3.5 text-lg">
                    <span className="sr-only">Jij: </span>
                    {b.tekst}
                  </div>
                );
              return (
                <div key={b.id} className="w-full tablet:max-w-[92%] rounded-[20px] border border-[#e9f5ff] bg-wit px-5 py-4 shadow-[0_8px_24px_#92c5eb17]">
                  <MeesAfzender />
                  <p className="mt-2 whitespace-pre-wrap break-words text-lg leading-relaxed">{b.tekst}</p>
                  {(b.kaart ?? (b.voorstel ? { soort: "voorstel", standaard: b.voorstel.standaard } : null)) && (
                    <KaartWeergave kaart={(b.kaart ?? { soort: "voorstel", standaard: b.voorstel!.standaard }) as Kaart} actief={isLaatste} onKies={kies} onStartVoorstel={startVoorstel} onStartTafels={startTafels} />
                  )}
                  {b.id === laatsteMees && isLaatste && b.keuzes && b.keuzes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {b.keuzes.map((k) => (
                        <button
                          key={k.label}
                          type="button"
                          disabled={navigeert}
                          onClick={() => kies(k)}
                          className={`min-h-12 rounded-[14px] border px-4 font-semibold disabled:opacity-60 ${
                            k.soort === "voorstel" || k.soort === "hervat" ? "border-actie-blauw bg-actie-blauw text-wit hover:bg-actie-hover" : "border-[#cfe6fb] bg-[#f3f9ff] text-inkt hover:border-actie-blauw hover:bg-blauw-zacht"
                          }`}
                        >
                          {k.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <VoorleesLink id={b.id} tekst={b.kaart?.soort === "weetje" && vindWeetje(b.kaart.id) ? weetjeVoorleesTekst(vindWeetje(b.kaart.id)!) : b.tekst} />
                  </div>
                </div>
              );
            })}
            <div ref={eindeRef} className="scroll-mb-32 tablet:scroll-mb-40" />
          </div>
        </div>

        {/* Tijdens het oefenen staat de bediening in de vraag zelf; daarna komt het invoerveld terug. */}
        {!oefentBezig && (
          <div className="sticky bottom-0 z-10 bg-gradient-to-t from-[#f5fbff] via-[#f5fbff]/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 tablet:px-8">
            <div className="mx-auto max-w-[860px]">{invoerVeld}</div>
          </div>
        )}
      </div>
    </ChatVoorleesContext>
  );
}

function KaartWeergave({
  kaart,
  actief,
  onKies,
  onStartVoorstel,
  onStartTafels,
}: {
  kaart: Kaart;
  actief: boolean;
  onKies: (k: Keuze) => void;
  onStartVoorstel: (keuze: string, aantal: number, label: string) => void;
  onStartTafels: (i: TafelInstelling, label: string) => void;
}) {
  switch (kaart.soort) {
    case "voorstel":
      return <VoorstelKaart standaard={kaart.standaard} actief={actief} onStart={onStartVoorstel} />;
    case "tafels":
      return <TafelKaart tafels={kaart.tafels} bewerking={kaart.bewerking} actief={actief} onStart={onStartTafels} />;
    case "voortgang":
      return <VoortgangKaart actief={actief} onKies={onKies} />;
    case "weetjes":
      return <WeetjesKaart actief={actief} onKies={onKies} />;
    case "weetje":
      return <WeetjeKaart id={kaart.id} />;
  }
}
