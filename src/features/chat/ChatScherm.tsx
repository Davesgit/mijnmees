"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { vindOnderdeel } from "@/content/onderwerpen";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { useProfiel } from "@/components/mees/Profiel";
import { useVoorlezen } from "@/components/mees/Voorlezen";
import { namen } from "@/features/oefenen/europa-vragen";
import { gaVerder, gastLimietBereikt, maakEuropaSessie, maakSessie, maakTafelSessie, openSessie, registreerAntwoord, rondOvergangAf, sessieRoute, startNiveau, vraagHulp } from "@/features/oefenen/sessie";
import { vindVraag } from "@/features/oefenen/vragen";
import type { OpslagData } from "@/features/oefenen/types";
import { sessieNaam } from "@/features/oefenen/weergave";
import { haalOpslag, useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";
import { Invoer, type Optie } from "./ChatInvoer";

/** Wat een optie in de chatbalk doet. */
type OptieActie =
  | { soort: "antwoord"; waarde: string }
  | { soort: "hint" }
  | { soort: "verder" }
  | { soort: "nogEenRondje" }
  | { soort: "ietsAnders" }
  | { soort: "account" }
  | { soort: "keuze"; keuze: Keuze };
import { EuropaKaart, TafelKaart, VoorstelKaart, voorstelOpties, VoortgangKaart, type EuropaInstelling, type TafelInstelling } from "./ChatKaarten";
import { ChatMenu, NaamVeld } from "./ChatOpties";
import { markeerNieuw, NaTypen, TypTekst } from "./ChatTypen";
import { ChatVoorleesContext, MeesAfzender, VoorleesLink } from "./ChatVoorlezen";
import { antwoord, groepVraag, groepZin, leesGroep, reageer, startkaarten, type Antwoord, type Bericht, type Context, type Kaart, type Keuze, type Onderwerp } from "./gesprek";
import { OefenBlok } from "./OefenBlok";
import { antwoordOpties, faseVan, kanInChat, leesAntwoord, leesOpdracht, oefenTeller, STANDAARD_AANTAL } from "./oefen-verloop";
import { leesKlok, markeerActie, useKaartKeuze, useMeesBezig, zetKaartKeuze } from "./ritme";
import { maakBericht as bericht, useChats, voegToeAanActief } from "./opslag";
import { useGespreksScroll } from "./useGespreksScroll";
import { voortgangSamenvatting, voortgangSoorten, voortgangVan, voortgangVoorstellen } from "./voortgang-chat";
const kaartIcoon: Record<(typeof startkaarten)[number]["onderwerp"], AlleIcoonNamen> = { leren: "boek", oefenen: "herhaal", vraag: "chat" };

/** Gasten oefenen gratis een paar rondjes; daarna een gratis account (dan wordt de voortgang bewaard en zichtbaar voor de ouder). */
const GAST_GRENS_TEKST =
  "Je hebt je gratis gastrondjes gebruikt. Vraag je ouder om een gratis account: dan bewaar ik al je voortgang en kun je onbeperkt verder oefenen. Wat je al hebt geoefend, gaat mee. Mees is en blijft altijd gratis.";
const ACCOUNT_TEKST =
  "Met een gratis account bewaar ik al je voortgang en kan je ouder zien wat je hebt geoefend. Wat je als gast al hebt gedaan, gaat mee. Vraag je ouder om te helpen. Heb je al een account?";
const accountKeuzes: Keuze[] = [
  { label: "Maak een gratis account", soort: "ga", href: "/ouder/account-aanmaken" },
  { label: "Ik heb al een account", soort: "ga", href: "/ouder/inloggen" },
];

/** Keuzes onder "Veel plezier!": handig als het kind na het oefenen terugkomt in het gesprek. */
const naTerugkomst: Keuze[] = [
  { label: "Verder oefenen", soort: "vervolg", onderwerp: "oefenen" },
  { label: "Iets leren", soort: "vervolg", onderwerp: "leren" },
  { label: "Mijn voortgang", soort: "vervolg", onderwerp: "voortgang" },
];

/** De chat met Mees: de hoofdingang voor kinderen (ontwerp versie 6). `meldingen` staan op het welkomstscherm. */
export function ChatScherm({ meldingen, gesprekOpen = true }: { meldingen?: ReactNode; /** Volgens het cookie staat er een gesprek open (dan geen welkomstscherm vooraf). */ gesprekOpen?: boolean }) {
  const router = useRouter();
  const { kind } = useProfiel();
  const opslag = useOpslag();
  const chats = useChats();
  const [invoer, setInvoer] = useState("");
  const [navigeert, startNavigatie] = useTransition();
  const voorlezen = useVoorlezen();
  const [leestId, setLeestId] = useState<string | null>(null);
  const [hernoemen, setHernoemen] = useState(false);
  const [bewaarFout, setBewaarFout] = useState(false);
  const meesBezig = useMeesBezig();
  const kaartKeuze = useKaartKeuze();

  const gesprek = chats?.actief ? (chats.gesprekken.find((g) => g.id === chats.actief) ?? null) : null;
  const laatste = gesprek?.berichten.at(-1);
  const actieveOefening = laatste?.oefening && laatste.oefening.tot === undefined ? opslag?.sessies[laatste.oefening.sessieId] : undefined;
  const oefentBezig = actieveOefening?.status === "bezig";
  // De open vraag (voor de chatbalk): antwoorden, of verder na goed/uitleg.
  const sessie = oefentBezig ? actieveOefening : undefined;
  const slot = sessie && sessie.soort !== "puzzel" ? sessie.slots[sessie.index] : undefined;
  const vraag = slot ? vindVraag(slot.vraagId) : null;
  const fase = slot ? faseVan(slot) : null;
  // Verandert bij elke stap in de oefening: dan het nieuwste deel in beeld brengen.
  const stand = `${gesprek?.id}-${gesprek?.berichten.length}-${actieveOefening?.versie}-${actieveOefening?.status}-${opslag?.pogingen.length}`;

  // Scrollen zoals in een AI-chat (zie useGespreksScroll).
  const { log, ruimte, markeerVerstuurd } = useGespreksScroll(gesprek?.id, stand);

  // Voorlezen stopt bij een andere chat.
  const gesprekId = gesprek?.id;
  useEffect(() => () => voorlezen.stop(), [gesprekId]); // eslint-disable-line react-hooks/exhaustive-deps

  function context(): Context {
    const data = haalOpslag();
    const open = openSessie(data);
    const v = voorstelOpties(data)[0]!;
    return { open: open ? sessieNaam(open) : null, voorstel: v.naam, voorstelId: v.id, aantal: STANDAARD_AANTAL, voortgang: voortgangSoorten(data), groep: kind?.groep ?? data.groep };
  }

  /** Berichten toevoegen: nieuwe antwoorden van Mees worden getypt, een bericht van het kind schuift naar boven. */
  const voegToe = (nieuw: Bericht[], opties?: Parameters<typeof voegToeAanActief>[1]) => {
    markeerNieuw(nieuw.filter((b) => b.van === "mees"));
    const kind = nieuw.find((b) => b.van === "kind");
    if (kind) markeerVerstuurd(kind.id);
    voegToeAanActief(nieuw, opties);
  };
  const meesZegt = (r: Antwoord) => bericht("mees", r.tekst, { keuzes: r.keuzes, kaart: r.kaart });

  // ── Oefenen via de chatbalk ──
  function oefenActie(w: (d: OpslagData) => OpslagData) {
    markeerActie();
    setBewaarFout(!wijzigOpslag(w));
  }
  function beantwoord(waarde: string) {
    if (!sessie) return;
    stopVoorlezen();
    zetKaartKeuze(null);
    const duur = vraag?.soort === "tafel" ? leesKlok() : undefined;
    oefenActie((d) => registreerAntwoord(d, sessie.id, waarde, { actieveDuurMs: duur })?.data ?? d);
  }
  function hint() {
    if (!sessie) return;
    stopVoorlezen();
    oefenActie((d) => vraagHulp(d, sessie.id));
  }
  function verder() {
    if (!sessie) return;
    stopVoorlezen();
    oefenActie((d) => gaVerder(d, sessie.id));
  }

  /** Getypte tekst tijdens het oefenen: een antwoord, een opdracht (hint, pauze, verder) of een eigen vraag. */
  function stuurTijdensOefenen(tekst: string) {
    if (!sessie) return;
    const opdracht = leesOpdracht(tekst);
    if (opdracht === "pauze") return pauze();
    if (opdracht === "hint" && fase === "antwoorden") return hint();
    if (opdracht === "verder" && fase && fase !== "antwoorden") return verder();
    if (fase === "antwoorden" && vraag && slot) {
      const a = leesAntwoord(tekst, vraag, slot, namen);
      if (a !== null) return beantwoord(a);
    }
    // Een eigen vraag of iets anders: Mees reageert, daarna gaat de oefening gewoon verder.
    const uitleg =
      fase !== "antwoorden"
        ? "Kies Volgende vraag als je verder wilt, of typ pauze om even te stoppen."
        : vraag?.soort === "tafel"
          ? "Typ je antwoord als getal, bijvoorbeeld 42. Of typ hint als je hulp wilt."
          : "Kies je antwoord onderin of typ het. Typ hint als je hulp wilt, of pauze om even te stoppen.";
    voegToe(
      [
        bericht("kind", tekst),
        bericht("mees", `Daar kan ik nog geen goed antwoord op geven, ik leer nog! ${uitleg}`),
        bericht("mees", "", { oefening: { sessieId: sessie.id, vanaf: sessie.index } }),
      ],
      { sluitSessie: { id: sessie.id, tot: sessie.index } },
    );
  }

  function stuur(tekst: string, onderwerp?: Onderwerp, titel?: string) {
    const schoon = tekst.trim().slice(0, 500);
    if (!schoon) return;
    stopVoorlezen();
    setInvoer("");
    if (sessie && !onderwerp) return stuurTijdensOefenen(schoon);
    // De groep: getypt ("ik zit in groep 7"), of als antwoord op Mees' vraag ook alleen een getal of "weet ik niet".
    const groepGevraagd = laatste?.van === "mees" ? laatste.keuzes?.find((k) => k.soort === "groep") : undefined;
    const getypt = onderwerp ? null : leesGroep(schoon, Boolean(groepGevraagd));
    if (getypt !== null) {
      if (kind) return voegToe([bericht("kind", schoon), bericht("mees", `Je groep staat in je profiel: groep ${kind.groep}. Je ouder kan die aanpassen.`)]);
      return kiesGroep(schoon, getypt, groepGevraagd?.vraag, groepGevraagd?.onderwerp);
    }
    if (groepGevraagd) {
      voegToe([bericht("kind", schoon), bericht("mees", "Typ of kies je groep: 5, 6, 7 of 8. Weet je het niet? Kies dan Weet ik niet.", { keuzes: laatste?.keuzes })]);
      return;
    }
    // Een gast zonder bekende groep: eerst de groep vragen, zodat de opdrachten passen. Daarna het antwoord op de vraag.
    if (!kind && haalOpslag().groep === undefined) {
      voegToe([bericht("kind", schoon), meesZegt(groepVraag(schoon, onderwerp))], { titel });
      return;
    }
    const reactie = onderwerp ? antwoord(onderwerp, context()) : reageer(schoon, context());
    voegToe([bericht("kind", schoon), meesZegt(reactie)], { titel });
  }

  /** Gast: groep bewaren en dan alsnog antwoorden op de eerste vraag (als die er was). */
  function kiesGroep(label: string, groep: number, vraag?: string, onderwerp?: Onderwerp) {
    wijzigOpslag((d) => ({ ...d, groep }));
    if (!vraag) {
      voegToe([bericht("kind", label), bericht("mees", groep ? `Ik heb onthouden dat je in groep ${groep} zit. Daar pas ik de opdrachten op aan.` : groepZin(0))]);
      return;
    }
    const reactie = onderwerp ? antwoord(onderwerp, context()) : reageer(vraag, context());
    voegToe([bericht("kind", label), meesZegt({ ...reactie, tekst: `${groepZin(groep)} ${reactie.tekst}` })]);
  }

  function kies(k: Keuze) {
    stopVoorlezen();
    if (k.soort === "groep") return kiesGroep(k.label, k.groep, k.vraag, k.onderwerp);
    if (k.soort === "vervolg") {
      const reactie = antwoord(k.onderwerp, context());
      voegToe([bericht("kind", k.label), meesZegt(reactie)]);
      return;
    }
    if (k.soort === "voortgang") {
      // Eerst een samenvatting in gewone woorden, dan het overzicht; oefenen kies je daarna in de chatbalk.
      const data = haalOpslag();
      const items = voortgangVan(data, k.filter);
      const open = openSessie(data);
      const keuzes: Keuze[] = items.length
        ? [
            ...(open && kanInChat(open) ? [{ label: "Verder waar ik was", soort: "hervat" as const }] : []),
            ...voortgangVoorstellen(items),
            { label: "Verder oefenen", soort: "vervolg", onderwerp: "oefenen" },
            { label: "Iets anders bekijken", soort: "vervolg", onderwerp: "voortgang" },
          ]
        : [{ label: "Ja, oefenen", soort: "vervolg", onderwerp: "oefenen" }];
      voegToe([bericht("kind", k.label), bericht("mees", voortgangSamenvatting(items, k.filter), { kaart: items.length ? { soort: "voortgang", filter: k.filter } : undefined, keuzes })]);
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
    if (k.soort === "ga") ga(k.label, k.href);
  }

  function ga(label: string, href: string) {
    const tekst = href.startsWith("/ouder") ? "Ik open het voor je. Vraag je ouder om mee te kijken." : "Veel plezier! Als je terugkomt, praten we hier verder.";
    voegToe([bericht("kind", label), bericht("mees", tekst, { keuzes: naTerugkomst })]);
    startNavigatie(() => router.push(href));
  }

  /** Start een rondje in het gesprek: rekenen (voorstel) of tafels. */
  function startRondje(maak: (d: OpslagData) => { data: OpslagData; sessie: { id: string } } | null, label: string) {
    stopVoorlezen();
    const data = haalOpslag();
    if (!kind && gastLimietBereikt(data)) {
      voegToe([
        bericht("kind", label),
        bericht("mees", GAST_GRENS_TEKST, { keuzes: accountKeuzes }),
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
    // Meteen de eerste vraag (zonder extra bericht ertussen), zodat die direct helemaal in beeld komt.
    voegToe([
      bericht("kind", label),
      ...(gelukt ? [] : [bericht("mees", "Let op: bewaren lukt nu niet in deze browser. Je kunt wel oefenen.")]),
      bericht("mees", "", { oefening: { sessieId, vanaf: 0 } }),
    ]);
  }

  function startVoorstel(keuze: string, aantal: number, label: string) {
    startRondje((d) => {
      const o = vindOnderdeel(keuze.replace(/^doel:/, ""));
      if (!o?.onderdeel.leerdoelId) return null;
      return maakSessie(d, { leerdoelId: o.onderdeel.leerdoelId, onderdeelId: o.onderdeel.id, onderwerpId: o.onderwerp.id, niveau: startNiveau(d, o.onderdeel.leerdoelId, kind?.groep ?? d.groep), aantal, bron: "voorstel" });
    }, label);
  }

  function startEuropa(i: EuropaInstelling, label: string) {
    startRondje((d) => maakEuropaSessie(d, { gebieden: i.gebieden, landen: i.landen, onderwerpen: i.onderwerpen, vorm: i.vorm }), label);
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
    if (sessie?.soort === "europa" || sessie?.soort === "puzzel")
      voegToe([bericht("kind", "Nog een rondje!"), bericht("mees", "Leuk! Wat wil je nu oefenen op de kaart?", { kaart: { soort: "europa", vorm: sessie.soort === "puzzel" ? "puzzel" : "afwisselend" } })]);
    else if (sessie?.soort === "tafels")
      voegToe([bericht("kind", "Nog een rondje!"), bericht("mees", "Leuk! Welke tafels wil je nu doen?", { kaart: { soort: "tafels", tafels: sessie.instellingen?.tafels ?? [] } })]);
    else voegToe([bericht("kind", "Nog een rondje!"), bericht("mees", "Leuk! Kies wat je wilt doen en hoeveel vragen.", { kaart: { soort: "voorstel", standaard: voorstelOpties(haalOpslag())[0]!.id } })]);
  }

  function ietsAnders() {
    voegToe([bericht("kind", "Iets anders doen."), meesZegt(antwoord("leren", context()))]);
  }

  function aanmelden() {
    voegToe([bericht("kind", "Aanmelden / inloggen"), bericht("mees", ACCOUNT_TEKST, { keuzes: accountKeuzes })]);
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

  // Klikbare opties in de chatbalk: antwoorden en vervolgstappen tijdens het oefenen, anders de keuzes van Mees.
  const opties: Optie<OptieActie>[] = [];
  if (sessie?.soort === "puzzel") {
    // De puzzel bedien je op de kaart; pauzeren kan bovenin of door "pauze" te typen.
  } else if (sessie && slot && vraag && fase === "antwoorden") {
    if (vraag.soort === "europa" && vraag.type === "map-click" && kaartKeuze?.slotId === slot.id)
      opties.push({ label: `Controleer: ${namen[kaartKeuze.id] ?? "deze plek"}`, primair: true, doe: { soort: "antwoord", waarde: kaartKeuze.id } });
    for (const o of antwoordOpties(vraag, slot)) opties.push({ label: o.label, doe: { soort: "antwoord", waarde: o.waarde } });
    // Om hulp vragen gaat door "hint" te typen (een knop hier leidt af); de tip staat in het invoerveld.
  } else if (sessie && fase) {
    const laatsteVraag = sessie.index + 1 >= sessie.slots.length;
    opties.push({ label: laatsteVraag ? "Rond af" : fase === "goed" ? "Volgende vraag" : "Verder", primair: true, doe: { soort: "verder" } });
  } else if (laatste?.oefening && actieveOefening?.status === "afgerond") {
    // Gast aan de grens: geen nieuw rondje, wel een gratis account voorstellen.
    if (!kind && opslag && gastLimietBereikt(opslag)) for (const k of accountKeuzes) opties.push({ label: k.label, primair: k.label.startsWith("Maak"), doe: { soort: "keuze", keuze: k } });
    else {
      opties.push({ label: "Nog een rondje", primair: true, doe: { soort: "nogEenRondje" } }, { label: "Iets anders doen", doe: { soort: "ietsAnders" } });
      // Gasten kunnen na elk rondje al een account maken of inloggen, zodat hun voortgang bewaard blijft.
      if (!kind) opties.push({ label: "Aanmelden / inloggen", doe: { soort: "account" } });
    }
  } else if (laatste?.van === "mees" && laatste.keuzes?.length) {
    for (const k of laatste.keuzes) opties.push({ label: k.label, primair: k.soort === "voorstel" || k.soort === "hervat", doe: { soort: "keuze", keuze: k } });
  }

  function voerUit(a: OptieActie) {
    if (a.soort === "antwoord") return beantwoord(a.waarde);
    if (a.soort === "hint") return hint();
    if (a.soort === "verder") return verder();
    if (a.soort === "nogEenRondje") return nogEenRondje();
    if (a.soort === "ietsAnders") return ietsAnders();
    if (a.soort === "account") return aanmelden();
    return kies(a.keuze);
  }

  const plaatshouder = !gesprek
    ? "Praat met Mees of typ je vraag…"
    : fase === "antwoorden"
      ? "Typ je antwoord, of typ hint voor hulp…"
      : "Typ een bericht aan Mees…";

  const invoerVeld = (
    <Invoer
      waarde={invoer}
      onWijzig={setInvoer}
      onStuur={() => stuur(invoer)}
      onLuisteren={stopVoorlezen}
      plaatshouder={plaatshouder}
      kortePlaatshouder={!gesprek ? "Typ je vraag…" : fase === "antwoorden" ? "Antwoord of hint…" : "Typ een bericht…"}
      opties={opties}
      onOptie={(o) => voerUit(o.doe)}
      optiesWachten={meesBezig || navigeert}
      cijfers={fase === "antwoorden" && vraag?.soort === "tafel"}
    />
  );

  // Eerste weergave: nog onbekend of er een gesprek openstaat.
  // Nog niet bekend wat er op dit apparaat staat: het welkomstscherm kan al meteen (ook vanaf de server),
  // behalve als er volgens het cookie een gesprek openstaat.
  if ((chats === null || opslag === null) && gesprekOpen) return <div className="chat-achtergrond flex-1" aria-hidden />;

  const voorleesWaarde = { leestId, bezig: voorlezen.bezig, laadt: voorlezen.status === "laden", lees };

  if (!gesprek) {
    return (
      <div className="chat-achtergrond flex flex-1 flex-col items-center justify-center px-4 py-8 tablet:px-[7%] tablet:py-12">
        <section className="w-full text-center">
          <div className="relative mx-auto mb-4 w-40 tablet:mb-5 tablet:w-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/merk/mees-vogel.png" alt="" className="mx-auto h-28 w-auto tablet:h-36" />
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

  const teller = actieveOefening && oefentBezig ? oefenTeller(actieveOefening) : null;

  return (
    <ChatVoorleesContext value={voorleesWaarde}>
      <div className="chat-achtergrond flex flex-1 flex-col">
        {teller && actieveOefening && (
          <div data-sticky-boven className="sticky top-14 z-20 border-b border-[#e1f1fe] bg-[#f5fbff]/95 backdrop-blur tablet:top-0">
            <div className="mx-auto flex max-w-[860px] items-center gap-4 px-4 py-2.5 tablet:px-8">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {actieveOefening.soort === "puzzel" ? `${teller.klaar} van ${teller.totaal} landen` : `Vraag ${teller.nummer} van ${teller.totaal}`} <span className="font-semibold text-tekst-zacht">· {sessieNaam(actieveOefening)}</span>
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
          <div className="flex items-center gap-1">
            {hernoemen ? (
              <NaamVeld gesprek={gesprek} onKlaar={() => setHernoemen(false)} className="w-full text-xl tablet:text-2xl" />
            ) : (
              <h1 className="min-w-0">
                <button type="button" onClick={() => setHernoemen(true)} title="Naam wijzigen" className="block max-w-full truncate rounded-[10px] px-1 text-left text-xl font-extrabold hover:bg-blauw-zacht tablet:text-2xl">
                  {gesprek.titel}
                  <span className="sr-only"> (tik om de naam te wijzigen)</span>
                </button>
              </h1>
            )}
            <ChatMenu gesprek={gesprek} onHernoem={() => setHernoemen(true)} />
          </div>
          <div ref={log} role="log" aria-live="polite" aria-label="Gesprek met Mees" className="mt-4 flex flex-col gap-3 pb-6">
            {gesprek.berichten.map((b) => {
              const isLaatste = b.id === laatste?.id;
              if (b.oefening)
                return (
                  <NaTypen key={b.id} id={b.id}>
                    <OefenBlok verwijzing={b.oefening} actief={isLaatste} />
                  </NaTypen>
                );
              if (b.van === "kind")
                return (
                  <div key={b.id} data-stap={b.id} className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] bg-[#e0f2ff] px-5 py-3.5 text-lg">
                    <span className="sr-only">Jij: </span>
                    {b.tekst}
                  </div>
                );
              return (
                <div key={b.id} data-stap={b.id} className="w-full tablet:max-w-[92%] rounded-[20px] border border-[#e9f5ff] bg-wit px-5 py-4 shadow-[0_8px_24px_#92c5eb17]">
                  <MeesAfzender />
                  <TypTekst id={b.id} tekst={b.tekst} className="mt-2 whitespace-pre-wrap break-words text-lg leading-relaxed">
                    {(b.kaart ?? (b.voorstel ? { soort: "voorstel", standaard: b.voorstel.standaard } : null)) && (
                      <KaartWeergave kaart={(b.kaart ?? { soort: "voorstel", standaard: b.voorstel!.standaard }) as Kaart} actief={isLaatste} onStartVoorstel={startVoorstel} onStartTafels={startTafels} onStartEuropa={startEuropa} />
                    )}
                    <div className="mt-3">
                      <VoorleesLink id={b.id} tekst={b.tekst} />
                    </div>
                  </TypTekst>
                </div>
              );
            })}
          </div>
          <div ref={ruimte} aria-hidden />
        </div>

        {/* De chatbalk staat altijd onderaan, zoals in een AI-chat; daarboven verschijnen de berichten van Mees. */}
        <div data-sticky-onder className="sticky bottom-0 z-10 border-t border-[#dcebf8] bg-[#f5fbff] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_#69b5ec1a] tablet:px-8">
          <div className="mx-auto max-w-[860px]">
            {bewaarFout && <p className="mb-2 rounded-[12px] bg-fout-zacht px-4 py-2 font-semibold text-fout">Bewaren lukt nu niet. Sluit dit scherm nog niet.</p>}
            {invoerVeld}
          </div>
        </div>
      </div>
    </ChatVoorleesContext>
  );
}

function KaartWeergave({
  kaart,
  actief,
  onStartVoorstel,
  onStartTafels,
  onStartEuropa,
}: {
  kaart: Kaart;
  actief: boolean;
  onStartVoorstel: (keuze: string, aantal: number, label: string) => void;
  onStartTafels: (i: TafelInstelling, label: string) => void;
  onStartEuropa: (i: EuropaInstelling, label: string) => void;
}) {
  switch (kaart.soort) {
    case "voorstel":
      return <VoorstelKaart standaard={kaart.standaard} actief={actief} onStart={onStartVoorstel} />;
    case "tafels":
      return <TafelKaart tafels={kaart.tafels} bewerking={kaart.bewerking} actief={actief} onStart={onStartTafels} />;
    case "europa":
      return <EuropaKaart vorm={kaart.vorm} onderwerpen={kaart.onderwerpen} actief={actief} onStart={onStartEuropa} />;
    case "voortgang":
      return <VoortgangKaart filter={kaart.filter} />;
    case "weetjes":
    case "weetje":
      return null;
  }
}
