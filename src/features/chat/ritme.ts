"use client";

import { useSyncExternalStore } from "react";

// Het ritme van het gesprek: is Mees nog bezig (denken, typen, een reactie opbouwen)? Dan wachten de opties in de
// chatbalk even, zodat een kind eerst ziet wat Mees zegt. Ook: was er net een actie van het kind (dan reageert Mees
// zichtbaar met puntjes en typen; bij herladen staat alles er meteen).

// Twee tellers: typen (tekst verschijnt) en wachten (puntjes of een vervolg dat nog moet komen).
let typen = 0;
let wachten = 0;
const luisteraars = new Set<() => void>();
const meld = () => luisteraars.forEach((l) => l());
const abonneer = (l: () => void) => {
  luisteraars.add(l);
  return () => luisteraars.delete(l);
};

function teller(bij: (n: number) => void): () => void {
  bij(1);
  meld();
  let klaar = false;
  return () => {
    if (klaar) return;
    klaar = true;
    bij(-1);
    meld();
  };
}

/** Mees typt (tekst verschijnt); geeft een afmeldfunctie terug (veilig om vaker aan te roepen). */
export const meesTypt = () => teller((n) => (typen = Math.max(0, typen + n)));
/** Er wacht iets van Mees om te verschijnen (puntjes, vervolg). */
export const meesWacht = () => teller((n) => (wachten = Math.max(0, wachten + n)));

/** Is Mees nog bezig met zijn reactie (typen of nog iets laten verschijnen)? Dan wachten de opties in de chatbalk. */
export function useMeesBezig() {
  return useSyncExternalStore(abonneer, () => typen + wachten > 0, () => false);
}
/** Typt Mees op dit moment? (Een vervolg wacht daarop.) */
export function useMeesTypt() {
  return useSyncExternalStore(abonneer, () => typen > 0, () => false);
}

let netGehandeld = false;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Het kind deed net iets (antwoord, hint, volgende): de reactie van Mees verschijnt zichtbaar. */
export function markeerActie() {
  netGehandeld = true;
  clearTimeout(timer);
  timer = setTimeout(() => (netGehandeld = false), 1200);
}

export const isNetGehandeld = () => netGehandeld;

export const rustigeWeergave = () => document.documentElement.dataset.rustigeOvergangen === "true" || matchMedia("(prefers-reduced-motion: reduce)").matches;

// Gekozen plek op de kaart (Europa "Waar ligt …?"): de chatbalk toont dan "Controleer: …".
let kaartKeuze: { slotId: string; id: string } | null = null;
const kaartLuisteraars = new Set<() => void>();
const abonneerKaart = (l: () => void) => {
  kaartLuisteraars.add(l);
  return () => kaartLuisteraars.delete(l);
};
export function zetKaartKeuze(k: { slotId: string; id: string } | null) {
  kaartKeuze = k;
  kaartLuisteraars.forEach((l) => l());
}
export function useKaartKeuze() {
  return useSyncExternalStore(abonneerKaart, () => kaartKeuze, () => null);
}

// Actieve antwoordtijd van de open vraag (tafels op tijd); de vraagkaart meet, de chatbalk leest af bij het antwoorden.
let klok: (() => number) | null = null;
export function zetKlok(k: (() => number) | null) {
  klok = k;
}
export const leesKlok = () => klok?.();
