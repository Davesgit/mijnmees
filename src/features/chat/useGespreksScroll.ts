"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// Scrollen zoals in een AI-chat: een verstuurd bericht schuift naar boven (net onder de vaste balken) en het
// antwoord groeit eronder naar beneden. Je ziet altijd eerst het begin van een antwoord, nooit het midden.

const randBoven = () => Math.max(0, ...[...document.querySelectorAll<HTMLElement>("[data-sticky-boven]")].map((e) => e.getBoundingClientRect().bottom)) + 12;
const randOnder = () => (document.querySelector<HTMLElement>("[data-sticky-onder]")?.getBoundingClientRect().top ?? window.innerHeight) - 12;
const zachtScrollen = () => document.documentElement.dataset.rustigeOvergangen !== "true" && !matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Zet de bovenkant van een element net onder de vaste balken. */
function zetBovenaan(el: HTMLElement, vloeiend: boolean) {
  window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - randBoven(), behavior: vloeiend && zachtScrollen() ? "smooth" : "auto" });
}

/**
 * Scrollen zoals in een AI-chat, voor de kinder- en de ouderchat. Een verstuurd bericht schuift naar boven en het
 * antwoord groeit eronder; daarvoor is onder het gesprek tijdelijk ruimte nodig, die meekrimpt als het antwoord
 * groeit. Nieuwe stappen (bijv. feedback tijdens het oefenen) beginnen ook bovenaan. `stand` verandert bij elke stap.
 */
export function useGespreksScroll(gesprekId: string | undefined, stand: string) {
  const verstuurd = useRef<string | null>(null);
  const anker = useRef<string | null>(null);
  const ruimte = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const gezien = useRef<{ gesprek: string; stappen: Set<string> } | null>(null);

  function pasRuimteAan() {
    const r = ruimte.current;
    if (!r) return;
    const a = anker.current ? document.querySelector<HTMLElement>(`[data-stap="${CSS.escape(anker.current)}"]`) : null;
    if (!a) {
      r.style.height = "0px";
      return;
    }
    const inhoud = r.getBoundingClientRect().top - a.getBoundingClientRect().top;
    r.style.height = `${Math.max(0, randOnder() - randBoven() - inhoud)}px`;
  }

  useLayoutEffect(() => {
    if (!gesprekId) {
      gezien.current = null;
      return;
    }
    const stappen = [...document.querySelectorAll<HTMLElement>("[role=log] [data-stap]")];
    const vorige = gezien.current?.gesprek === gesprekId ? gezien.current.stappen : null;
    gezien.current = { gesprek: gesprekId, stappen: new Set(stappen.map((e) => e.dataset.stap!)) };
    const kind = verstuurd.current ? stappen.find((e) => e.dataset.stap === verstuurd.current) : undefined;
    if (kind) {
      // Net verstuurd: dit bericht bovenaan, het antwoord verschijnt eronder.
      verstuurd.current = null;
      anker.current = kind.dataset.stap!;
      pasRuimteAan();
      zetBovenaan(kind, Boolean(vorige));
      return;
    }
    if (!vorige) {
      // Gesprek (opnieuw) geopend: het begin van het laatste bericht.
      anker.current = null;
      pasRuimteAan();
      const laatsteStap = stappen.at(-1);
      if (laatsteStap) zetBovenaan(laatsteStap, false);
      return;
    }
    // Nieuwe reactie van Mees tijdens het oefenen (feedback, hint, volgende vraag): net als een antwoord in een
    // AI-chat bovenaan laten beginnen, met ruimte eronder om naar beneden te groeien.
    const doel = stappen.find((e) => !vorige.has(e.dataset.stap!));
    if (!doel) return pasRuimteAan();
    anker.current = doel.dataset.stap!;
    pasRuimteAan();
    zetBovenaan(doel, true);
  }, [stand]); // eslint-disable-line react-hooks/exhaustive-deps

  // Groeit of krimpt de inhoud (typen, kaarten, schermformaat): de vrije ruimte eronder meeschalen.
  useEffect(() => {
    const l = log.current;
    if (!l) return;
    const ro = new ResizeObserver(() => pasRuimteAan());
    ro.observe(l);
    // Wat later verschijnt (bijv. een oefening na het typen) telt ook als gezien; anders lijkt het bij de volgende
    // stap "nieuw" en springt het scherm terug.
    const mo = new MutationObserver(() => {
      if (gezien.current) gezien.current.stappen = new Set([...l.querySelectorAll<HTMLElement>("[data-stap]")].map((e) => e.dataset.stap!));
    });
    mo.observe(l, { childList: true, subtree: true });
    window.addEventListener("resize", pasRuimteAan);
    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", pasRuimteAan);
    };
  }, [gesprekId]);


  return {
    log,
    ruimte,
    /** Het bericht dat het kind (of de ouder) net verstuurde: dat komt bovenaan. */
    markeerVerstuurd: (id: string) => {
      verstuurd.current = id;
    },
  };
}
