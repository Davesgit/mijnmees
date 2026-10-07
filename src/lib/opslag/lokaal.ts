"use client";

import { useSyncExternalStore } from "react";
import type { OpslagData } from "@/features/oefenen/types";

// Lokale opslag per profiel: een gast, of een kinderprofiel van een ingelogde ouder.
// Bij een kinderprofiel is dit de werkkopie; src/lib/opslag/sync.ts stuurt wijzigingen naar de server.
const GAST_SLEUTEL = "mees:gast:v1";
const kindSleutel = (kindId: string) => `mees:kind:${kindId}:v1`;

function leeg(): OpslagData {
  return {
    schemaVersie: 1,
    gastId: crypto.randomUUID(),
    sessies: {},
    pogingen: [],
    weetjes: [],
    reviews: [],
    instellingen: { groteTekst: false, rustigeOvergangen: false, rustigVerder: false },
  };
}

let sleutel = GAST_SLEUTEL;
let actiefKindId: string | null = null;
let huidig: OpslagData | null = null;
const luisteraars = new Set<() => void>();
const meld = () => luisteraars.forEach((l) => l());

function lees(s = sleutel): OpslagData {
  try {
    const ruw = window.localStorage.getItem(s);
    if (ruw) {
      const data = JSON.parse(ruw) as OpslagData;
      if (data.schemaVersie === 1) return { ...leeg(), ...data };
    }
  } catch {
    // Opslag niet beschikbaar (privévenster of geblokkeerd): werk in het geheugen.
  }
  return leeg();
}

function schrijf(data: OpslagData) {
  try {
    window.localStorage.setItem(sleutel, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Kiest welk profiel de opslag gebruikt. Idempotent; aanroepen vóór het lezen van de opslag. */
export function kiesProfiel(kindId: string | null) {
  const nieuw = kindId ? kindSleutel(kindId) : GAST_SLEUTEL;
  if (nieuw === sleutel) return;
  sleutel = nieuw;
  actiefKindId = kindId;
  huidig = null;
  if (typeof window !== "undefined") queueMicrotask(meld);
}

export function actiefProfiel() {
  return actiefKindId;
}

export function haalOpslag(): OpslagData {
  if (!huidig) huidig = lees();
  return huidig;
}

/** Past de opslag aan. Geeft false terug als bewaren in de browser niet lukte. */
export function wijzigOpslag(wijziging: (data: OpslagData) => OpslagData): boolean {
  const nieuw = wijziging(haalOpslag());
  if (nieuw === huidig) return true;
  huidig = nieuw;
  const gelukt = schrijf(nieuw);
  meld();
  return gelukt;
}

/** Leest de gastopslag, los van het actieve profiel (voor het meenemen naar een kinderprofiel). */
export function leesGastOpslag(): OpslagData | null {
  const data = lees(GAST_SLEUTEL);
  return Object.keys(data.sessies).length > 0 || data.pogingen.length > 0 ? data : null;
}

export function wisGastgegevens() {
  try {
    window.localStorage.removeItem(GAST_SLEUTEL);
  } catch {}
  if (sleutel === GAST_SLEUTEL) huidig = leeg();
  meld();
}

/** Verwijdert alle lokale kinderprofielen van dit apparaat (bij uitloggen op een gedeeld apparaat). */
export function wisKindprofielenOpApparaat() {
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k?.startsWith("mees:kind:")) window.localStorage.removeItem(k);
    }
  } catch {}
}

function abonneer(luisteraar: () => void) {
  luisteraars.add(luisteraar);
  // Wijzigingen uit een ander tabblad overnemen.
  const opStorage = (e: StorageEvent) => {
    if (e.key === sleutel) {
      huidig = lees();
      meld();
    }
  };
  window.addEventListener("storage", opStorage);
  return () => {
    luisteraars.delete(luisteraar);
    window.removeEventListener("storage", opStorage);
  };
}

/** De opslag, of null tijdens server-rendering en de eerste render (dan is de browseropslag nog onbekend). */
export function useOpslag(): OpslagData | null {
  return useSyncExternalStore(abonneer, haalOpslag, () => null);
}

/** Luisteren naar wijzigingen buiten React (synchronisatie). */
export const abonneerOpslag = abonneer;
