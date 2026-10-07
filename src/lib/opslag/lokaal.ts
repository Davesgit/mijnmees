"use client";

import { useSyncExternalStore } from "react";
import type { OpslagData } from "@/features/oefenen/types";

// Gastopslag: alles blijft in deze browser. Een account (fase 3) vervangt dit door Supabase.
const SLEUTEL = "mees:gast:v1";

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

let huidig: OpslagData | null = null;
const luisteraars = new Set<() => void>();

function lees(): OpslagData {
  try {
    const ruw = window.localStorage.getItem(SLEUTEL);
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
    window.localStorage.setItem(SLEUTEL, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
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
  luisteraars.forEach((l) => l());
  return gelukt;
}

export function wisGastgegevens() {
  try {
    window.localStorage.removeItem(SLEUTEL);
  } catch {}
  huidig = leeg();
  luisteraars.forEach((l) => l());
}

function abonneer(luisteraar: () => void) {
  luisteraars.add(luisteraar);
  // Wijzigingen uit een ander tabblad overnemen.
  const opStorage = (e: StorageEvent) => {
    if (e.key === SLEUTEL) {
      huidig = lees();
      luisteraars.forEach((l) => l());
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
