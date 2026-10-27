"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { isOefenRoute, ProfielMenu } from "@/components/mees/MeesHeader";
import { Logo } from "@/components/mees/Mees";
import { useProfiel } from "@/components/mees/Profiel";
import { ChatMenu, NaamVeld } from "./ChatOpties";
import { ZoekChats } from "./ChatZoeken";
import { wanneer } from "./tijd";
import { markeerNieuw } from "./ChatTypen";
import { antwoord } from "./gesprek";
import { voortgangSoorten } from "./voortgang-chat";
import { haalOpslag } from "@/lib/opslag/lokaal";
import { ChatWinkelContext, kindChats, maakBericht, type ChatWinkel } from "./opslag";

// Schil van de chat (ontwerp versie 6), voor kinderen en ouders: vast zijmenu naast de inhoud. Op de telefoon een
// smalle bovenbalk met een menu dat als laag over het scherm opent. Tijdens het oefenen geen menu (rust en ruimte).
// Bovenin en onderin het menu staat alles vast; alleen de lijst met chats ertussen scrolt.

/** Wat er per gebruiker (kind of ouder) anders is aan de schil. */
export type SchilInstelling = {
  winkel: ChatWinkel;
  /** Derde knop in het menu (voortgang). Wordt in het gesprek getoond; `pad` is de huidige pagina. */
  voortgang: { label: string; actie: (pad: string) => void };
  /** Vast onderin het menu. `naKeuze` sluit het menu na een klik; `pad` is de huidige pagina. */
  onderkant: (naKeuze: () => void, pad: string) => ReactNode;
  /** Tijdens het oefenen geen menu (alleen kinderen). */
  zonderMenu?: (pad: string) => boolean;
};

const INGEKLAPT = "mees:zijmenu:ingeklapt";

function leesIngeklapt() {
  try {
    return localStorage.getItem(INGEKLAPT) === "1";
  } catch {
    return false;
  }
}
const ingeklaptLuisteraars = new Set<() => void>();
function zetIngeklapt(waarde: boolean) {
  try {
    localStorage.setItem(INGEKLAPT, waarde ? "1" : "0");
  } catch {}
  ingeklaptLuisteraars.forEach((l) => l());
}
function abonneerIngeklapt(l: () => void) {
  ingeklaptLuisteraars.add(l);
  return () => ingeklaptLuisteraars.delete(l);
}

/** Schil van het kindergedeelte. */
export function KindSchil({ children }: { children: ReactNode }) {
  const router = useRouter();
  const instelling: SchilInstelling = {
    winkel: kindChats,
    voortgang: {
      label: "Mijn voortgang",
      // Voortgang verschijnt in het gesprek: in de open chat, of in een nieuwe chat.
      actie: (pad) => {
        const r = antwoord("voortgang", { open: null, voorstel: "", voorstelId: "", aantal: 0, voortgang: voortgangSoorten(haalOpslag()) });
        const mees = maakBericht("mees", r.tekst, { kaart: r.kaart, keuzes: r.keuzes });
        markeerNieuw([mees]);
        kindChats.voegToeAanActief([maakBericht("kind", "Hoe gaat het met mijn oefenen?"), mees], { titel: "Mijn voortgang" });
        if (pad !== kindChats.startPad) router.push(kindChats.startPad);
      },
    },
    onderkant: (naKeuze) => <KindOnderkant naKeuze={naKeuze} />,
    zonderMenu: isOefenRoute,
  };
  return <ChatSchil instelling={instelling}>{children}</ChatSchil>;
}

function KindOnderkant({ naKeuze }: { naKeuze: () => void }) {
  const { ouderIngelogd } = useProfiel();
  return (
    <>
      <Link
        href={ouderIngelogd ? "/ouder" : "/ouder/inloggen"}
        onClick={naKeuze}
        className="flex min-h-12 items-center gap-3 rounded-[12px] px-3 tekst-klein font-semibold text-tekst-zacht hover:bg-blauw-zacht hover:text-actie-blauw"
      >
        <Icoon naam="slot" className="size-5" />
        Voor ouders
      </Link>
      <ProfielMenu omhoog />
    </>
  );
}

/** De chatschil met zijmenu; de instelling bepaalt chatgeschiedenis, voortgang en de vaste onderkant. */
export function ChatSchil({ instelling, children }: { instelling: SchilInstelling; children: ReactNode }) {
  return (
    <ChatWinkelContext value={instelling.winkel}>
      <Suspense fallback={<Schil pad="" instelling={instelling}>{children}</Schil>}>
        <SchilMetPad instelling={instelling}>{children}</SchilMetPad>
      </Suspense>
    </ChatWinkelContext>
  );
}

function SchilMetPad({ instelling, children }: { instelling: SchilInstelling; children: ReactNode }) {
  return (
    <Schil pad={usePathname()} instelling={instelling}>
      {children}
    </Schil>
  );
}

function Schil({ pad, instelling, children }: { pad: string; instelling: SchilInstelling; children: ReactNode }) {
  const oefenen = pad !== "" && Boolean(instelling.zonderMenu?.(pad));
  const ingeklapt = useSyncExternalStore(abonneerIngeklapt, leesIngeklapt, () => false);
  const [mobielOpen, setMobielOpen] = useState(false);
  const [zoeken, setZoeken] = useState(false);
  // Muis op het smalle menu: het volledige menu klapt (over de inhoud heen) uit, en weer in als de muis weggaat.
  const [zwevend, setZwevend] = useState(false);
  const zweefTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const smalMenu = useRef<HTMLDivElement>(null);
  function muisErop(e: PointerEvent) {
    if (e.pointerType !== "mouse" || !smalMenu.current?.offsetWidth) return;
    clearTimeout(zweefTimer.current);
    zweefTimer.current = setTimeout(() => setZwevend(true), 120);
  }
  function muisEraf(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    clearTimeout(zweefTimer.current);
    // Een venster vanuit het menu (bijv. chat verwijderen) houdt het menu open.
    if (document.querySelector("dialog[open]")) return;
    zweefTimer.current = setTimeout(() => setZwevend(false), 220);
  }

  // Na navigeren het mobiele menu sluiten.
  const [vorigPad, setVorigPad] = useState(pad);
  if (pad !== vorigPad) {
    setVorigPad(pad);
    setMobielOpen(false);
    setZwevend(false);
  }

  useEffect(() => {
    if (!mobielOpen) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMobielOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [mobielOpen]);

  if (oefenen) {
    return (
      <main id="inhoud" className="flex flex-1 flex-col">
        {children}
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col tablet:flex-row">
      <a
        href="#inhoud"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-wit focus:px-4 focus:py-3 focus:text-actie-blauw"
      >
        Naar de inhoud
      </a>

      {/* Telefoon: bovenbalk met menuknop. */}
      <header data-sticky-boven className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[#e1f1fe] bg-wit/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur tablet:hidden">
        <button
          type="button"
          onClick={() => setMobielOpen(true)}
          aria-expanded={mobielOpen}
          aria-controls="kind-menu"
          aria-label="Menu openen"
          className="grid size-12 place-items-center rounded-full text-inkt hover:bg-blauw-zacht"
        >
          <Icoon naam="menu" />
        </button>
        <Link href={instelling.winkel.startPad} className="rounded-[12px] p-1" aria-label="Mees, naar start">
          <Logo className="h-8!" />
        </Link>
      </header>

      {mobielOpen && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Menu sluiten" className="absolute inset-0 bg-[#16396e]/30 backdrop-blur-[2px]" onClick={() => setMobielOpen(false)} />
          <div id="kind-menu" role="dialog" aria-modal="true" aria-label="Menu" className="mees-verschijn absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-[#fbfdff] shadow-zwevend">
            <MenuInhoud instelling={instelling} onZoeken={() => setZoeken(true)} pad={pad} compact={false} onSluit={() => setMobielOpen(false)} />
          </div>
        </div>
      )}

      {/* Tablet en groter: vast zijmenu; op tablet compact, op desktop naar keuze uit- of ingeklapt. */}
      <aside
        aria-label="Navigatie"
        onPointerEnter={muisErop}
        onPointerLeave={muisEraf}
        // Klik je meteen op een pictogram, dan niet tijdens de klik uitklappen (anders telt de klik niet).
        onPointerDown={() => clearTimeout(zweefTimer.current)}
        className={`sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-[#e1f1fe] bg-gradient-to-br from-[#fbfdff] to-[#f5fbff] tablet:flex ${ingeklapt ? "w-[84px]" : "w-[84px] desktop:w-[265px]"}`}
      >
        <div className={`h-full flex-col ${ingeklapt ? "hidden" : "hidden desktop:flex"}`}>
          <MenuInhoud instelling={instelling} onZoeken={() => setZoeken(true)} pad={pad} compact={false} onInklappen={() => zetIngeklapt(true)} />
        </div>
        <div ref={smalMenu} className={`h-full flex-col ${ingeklapt ? "flex" : "flex desktop:hidden"}`}>
          <MenuInhoud instelling={instelling} onZoeken={() => setZoeken(true)} pad={pad} compact onUitklappen={() => zetIngeklapt(false)} onMenu={() => setMobielOpen(true)} />
        </div>
        {zwevend && (
          <div className="mees-verschijn absolute inset-y-0 left-0 flex w-[265px] flex-col border-r border-[#e1f1fe] bg-[#fbfdff] shadow-zwevend">
            <MenuInhoud
              instelling={instelling}
              onZoeken={() => setZoeken(true)}
              pad={pad}
              compact={false}
              onKlaar={() => setZwevend(false)}
              onVastzetten={() => {
                zetIngeklapt(false);
                setZwevend(false);
              }}
            />
          </div>
        )}
      </aside>

      <main id="inhoud" className="flex min-w-0 flex-1 flex-col">
        {children}
      </main>
      <ZoekChats
        open={zoeken}
        pad={pad}
        onSluit={() => setZoeken(false)}
        onGekozen={() => {
          setMobielOpen(false);
          setZwevend(false);
        }}
      />
    </div>
  );
}

function MenuInhoud({
  instelling,
  pad,
  compact,
  onSluit,
  onInklappen,
  onUitklappen,
  onMenu,
  onKlaar,
  onVastzetten,
  onZoeken,
}: {
  instelling: SchilInstelling;
  pad: string;
  compact: boolean;
  /** Het zoekvenster openen (dat staat één keer in de schil). */
  onZoeken: () => void;
  /** Sluitknop tonen (mobiel menu); wordt ook na een keuze aangeroepen. */
  onSluit?: () => void;
  /** Na een keuze aanroepen, zonder sluitknop (uitgeklapt menu bij aanwijzen met de muis). */
  onKlaar?: () => void;
  /** Computer: het uitgeklapte menu blijvend openzetten. */
  onVastzetten?: () => void;
  onInklappen?: () => void;
  onUitklappen?: () => void;
  /** Tablet: het volledige menu (met profiel en Voor ouders) als laag openen. */
  onMenu?: () => void;
}) {
  const router = useRouter();
  const naKeuze = () => {
    onSluit?.();
    onKlaar?.();
  };
  const { winkel } = instelling;
  const START = winkel.startPad;
  const chats = winkel.useChats();
  const [hernoemId, setHernoemId] = useState<string | null>(null);
  // Alle chats (behalve gearchiveerde) staan in het menu, nieuwste bovenaan, zoals in AI-chats.
  const recent = chats?.gesprekken.filter((g) => !g.gearchiveerd) ?? [];
  const opStart = pad === START;

  function nieuw() {
    winkel.nieuweChat();
    naKeuze();
    if (!opStart) router.push(START);
  }
  function voortgang() {
    instelling.voortgang.actie(pad);
    naKeuze();
  }
  function open(id: string) {
    winkel.openChat(id);
    naKeuze();
    if (!opStart) router.push(START);
  }

  const items: { label: string; icoon: AlleIcoonNamen; actief: boolean; href?: string; onClick?: () => void }[] = [
    { label: "Nieuwe chat", icoon: "pen", actief: opStart && chats?.actief === null, onClick: nieuw },
    { label: "Chats zoeken", icoon: "zoek", actief: false, onClick: onZoeken },
    { label: instelling.voortgang.label, icoon: "voortgang", actief: false, onClick: voortgang },
  ];

  if (compact) {
    return (
      <nav aria-label="Snelmenu" className="flex h-full flex-col items-center gap-2 px-3 py-5">
        <button type="button" onClick={nieuw} aria-label="Mees, nieuwe chat" title="Mees" className="mb-3 grid size-14 place-items-center rounded-[16px] hover:bg-blauw-zacht">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/merk/mees-vogel.svg" alt="" className="h-9 w-auto" />
        </button>
        {items.map((i) =>
          i.href ? (
            <Link key={i.label} href={i.href} aria-label={i.label} title={i.label} aria-current={i.actief ? "page" : undefined} className={compactKlasse(i.actief)}>
              <Icoon naam={i.icoon} />
            </Link>
          ) : (
            <button key={i.label} type="button" onClick={i.onClick} aria-label={i.label} title={i.label} aria-current={i.actief ? "page" : undefined} className={compactKlasse(i.actief)}>
              <Icoon naam={i.icoon} />
            </button>
          ),
        )}
        {onUitklappen && (
          <button type="button" onClick={onUitklappen} aria-label="Menu uitklappen" title="Menu uitklappen" className="mt-2 hidden size-12 place-items-center rounded-full text-tekst-zacht hover:bg-blauw-zacht desktop:grid">
            <Icoon naam="paneel-in" className="size-6 rotate-180" />
          </button>
        )}
        {onMenu && (
          <button type="button" onClick={onMenu} aria-label="Menu openen (profiel en Voor ouders)" title="Menu" className="mt-auto grid size-12 place-items-center rounded-full text-tekst-zacht hover:bg-blauw-zacht desktop:hidden">
            <Icoon naam="menu" />
          </button>
        )}
      </nav>
    );
  }

  return (
    // Bovenin en onderin staat het menu vast; alleen de lijst met chats ertussen scrolt.
    <div className="flex h-full min-h-0 flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-2">
        <Link href={START} onClick={naKeuze} className="rounded-[12px] p-1" aria-label="Mees, naar start">
          <Logo className="h-12!" />
        </Link>
        {onSluit && (
          <button type="button" onClick={onSluit} aria-label="Menu sluiten" className="grid size-12 place-items-center rounded-full hover:bg-blauw-zacht">
            <Icoon naam="sluiten" />
          </button>
        )}
        {onVastzetten && (
          <button type="button" onClick={onVastzetten} aria-label="Menu vastzetten" title="Menu vastzetten" className="hidden size-10 place-items-center rounded-full text-tekst-zacht hover:bg-blauw-zacht desktop:grid">
            <Icoon naam="paneel-in" className="size-6 rotate-180" />
          </button>
        )}
        {onInklappen && (
          <button type="button" onClick={onInklappen} aria-label="Menu invouwen" title="Menu invouwen" className="grid size-10 place-items-center rounded-full text-tekst-zacht hover:bg-blauw-zacht">
            <Icoon naam="paneel-in" className="size-6" />
          </button>
        )}
      </div>

      <nav aria-label="Hoofdmenu" className="mt-5 flex flex-col gap-1.5">
        {items.map((i) =>
          i.href ? (
            <Link key={i.label} href={i.href} onClick={naKeuze} aria-current={i.actief ? "page" : undefined} className={itemKlasse(i.actief)}>
              <Icoon naam={i.icoon} className={`size-6 ${i.actief ? "" : "text-[#6574ac]"}`} />
              {i.label}
            </Link>
          ) : (
            <button key={i.label} type="button" onClick={i.onClick} aria-current={i.actief ? "page" : undefined} className={itemKlasse(i.actief)}>
              <Icoon naam={i.icoon} className={`size-6 ${i.actief ? "" : "text-[#6574ac]"}`} />
              {i.label}
            </button>
          ),
        )}
      </nav>

      {recent.length > 0 && (
        <section aria-labelledby="recent-kop" className="-mx-1 mt-5 flex min-h-0 flex-1 flex-col border-t border-[#e1f1fe] px-1 pt-5">
          <h2 id="recent-kop" className="px-3 tekst-klein font-semibold text-[#6574ac]">
            Chats
          </h2>
          <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pb-2">
            {recent.map((g) => {
              const actief = opStart && chats?.actief === g.id;
              return (
                <li key={g.id} className={`group flex items-center gap-1 rounded-[12px] pr-1 hover:bg-[#f1f9ff] ${actief ? "bg-[#e4f4ff]" : ""}`}>
                  {hernoemId === g.id ? (
                    <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
                      <Icoon naam="chat" className="size-5 shrink-0 text-[#6574ac]" />
                      <NaamVeld gesprek={g} onKlaar={() => setHernoemId(null)} className="w-full" />
                    </div>
                  ) : (
                    <button type="button" onClick={() => open(g.id)} aria-current={actief ? "page" : undefined} className="flex min-w-0 flex-1 items-start gap-3 rounded-[12px] px-3 py-2.5 text-left">
                      <Icoon naam="chat" className="mt-0.5 size-5 shrink-0 text-[#6574ac]" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{g.titel}</span>
                        <span className="block tekst-klein text-[#6574ac]">{wanneer(g.bijgewerkt)}</span>
                      </span>
                    </button>
                  )}
                  {/* Met een muis verschijnen de puntjes bij aanwijzen (zoals in AI-chats); op een aanraakscherm altijd. */}
                  <ChatMenu
                    gesprek={g}
                    onHernoem={() => setHernoemId(g.id)}
                    className={`${actief ? "" : "[@media(hover:hover)]:opacity-0"} group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-[#e1f1fe] pt-3">{instelling.onderkant(naKeuze, pad)}</div>
    </div>
  );
}

const itemKlasse = (actief: boolean) =>
  `flex min-h-12 w-full items-center gap-4 rounded-[12px] px-3 py-3 text-left text-[1.0625rem] font-semibold ${actief ? "bg-[#e4f4ff] text-actie-blauw" : "text-inkt hover:bg-[#f1f9ff]"}`;

const compactKlasse = (actief: boolean) => `grid size-12 place-items-center rounded-[12px] ${actief ? "bg-[#e4f4ff] text-actie-blauw" : "text-[#6574ac] hover:bg-[#f1f9ff] hover:text-inkt"}`;
