"use client";

import { useSyncExternalStore } from "react";
import { abonneerOpslag, actiefProfiel } from "@/lib/opslag/lokaal";
import { bewaarGesprek, type Gesprek } from "./gesprek";

// Gesprekken met Mees blijven op dit apparaat, per profiel (gast of kind). De sleutel van een kind begint met
// "mees:kind:", zodat uitloggen op een gedeeld apparaat (wisKindprofielenOpApparaat) ze ook wist.
export type ChatOpslag = { gesprekken: Gesprek[]; actief: string | null };

const GAST = "mees:gast:chats:v1";
const sleutel = () => {
  const kind = actiefProfiel();
  return kind ? `mees:kind:${kind}:chats:v1` : GAST;
};
const LEEG: ChatOpslag = { gesprekken: [], actief: null };

let cache: { sleutel: string; data: ChatOpslag } | null = null;
const luisteraars = new Set<() => void>();
const meld = () => luisteraars.forEach((l) => l());

function lees(): ChatOpslag {
  const s = sleutel();
  if (cache?.sleutel === s) return cache.data;
  let data = LEEG;
  try {
    const ruw = window.localStorage.getItem(s);
    if (ruw) {
      const d = JSON.parse(ruw) as ChatOpslag;
      if (Array.isArray(d.gesprekken)) data = { gesprekken: d.gesprekken, actief: d.actief ?? null };
    }
  } catch {
    // Geen opslag (privévenster): gesprekken blijven alleen in dit venster.
  }
  cache = { sleutel: s, data };
  return data;
}

function schrijf(data: ChatOpslag) {
  cache = { sleutel: sleutel(), data };
  try {
    window.localStorage.setItem(cache.sleutel, JSON.stringify(data));
  } catch {}
  meld();
}

export function wijzigChats(wijziging: (d: ChatOpslag) => ChatOpslag) {
  schrijf(wijziging(lees()));
}

export function bewaar(gesprek: Gesprek, actief = true) {
  wijzigChats((d) => ({ gesprekken: bewaarGesprek(d.gesprekken, gesprek), actief: actief ? gesprek.id : d.actief }));
}

/** Nieuwe chat: het lege startscherm. Eerdere gesprekken blijven staan. */
export function nieuweChat() {
  wijzigChats((d) => ({ ...d, actief: null }));
}

export function openChat(id: string) {
  wijzigChats((d) => ({ ...d, actief: id }));
}

export function verwijderChat(id: string) {
  wijzigChats((d) => ({ gesprekken: d.gesprekken.filter((g) => g.id !== id), actief: d.actief === id ? null : d.actief }));
}

export function wisGastChats() {
  try {
    window.localStorage.removeItem(GAST);
  } catch {}
  cache = null;
  meld();
}

function abonneer(l: () => void) {
  luisteraars.add(l);
  // Wissel van profiel loopt via de oefenopslag: dan opnieuw lezen.
  const weg = abonneerOpslag(l);
  const opStorage = (e: StorageEvent) => {
    if (e.key === sleutel()) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", opStorage);
  return () => {
    luisteraars.delete(l);
    weg();
    window.removeEventListener("storage", opStorage);
  };
}

/** De gesprekken, of null tijdens server-rendering en de eerste render. */
export function useChats(): ChatOpslag | null {
  return useSyncExternalStore(abonneer, lees, () => null);
}
