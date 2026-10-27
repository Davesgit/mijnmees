"use client";

import { createContext, use, useSyncExternalStore } from "react";
import { abonneerOpslag, actiefProfiel } from "@/lib/opslag/lokaal";
import { bewaarGesprek, GESPREK_OPEN_COOKIE, maakTitel, type Bericht, type Gesprek } from "./gesprek";

// Gesprekken met Mees blijven op dit apparaat. Kinderen (gast of kinderprofiel) en ouders hebben elk een eigen
// chatgeschiedenis met dezelfde functies; daarom één "winkel"-maker. De sleutel van een kind begint met "mees:kind:",
// zodat uitloggen op een gedeeld apparaat (wisKindprofielenOpApparaat) ze ook wist.
export type ChatOpslag = { gesprekken: Gesprek[]; actief: string | null };

const LEEG: ChatOpslag = { gesprekken: [], actief: null };

export const maakBericht = (van: Bericht["van"], tekst: string, extra: Partial<Pick<Bericht, "keuzes" | "kaart" | "oefening">> = {}): Bericht => ({
  id: crypto.randomUUID(),
  van,
  tekst,
  ...extra,
  t: Date.now(),
});

function maakChatWinkel({ sleutel, cookie, alsProfielWisselt, startPad }: { sleutel: () => string; cookie?: string; alsProfielWisselt?: (l: () => void) => () => void; startPad: string }) {
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
    if (cookie) document.cookie = `${cookie}=${data.actief ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
    meld();
  }

  function wijzigChats(wijziging: (d: ChatOpslag) => ChatOpslag) {
    schrijf(wijziging(lees()));
  }

  function bewaar(gesprek: Gesprek, actief = true) {
    wijzigChats((d) => ({ gesprekken: bewaarGesprek(d.gesprekken, gesprek), actief: actief ? gesprek.id : d.actief }));
  }

  function abonneer(l: () => void) {
    luisteraars.add(l);
    const weg = alsProfielWisselt?.(() => {
      cache = null;
      l();
    });
    const opStorage = (e: StorageEvent) => {
      if (e.key === sleutel()) {
        cache = null;
        l();
      }
    };
    window.addEventListener("storage", opStorage);
    return () => {
      luisteraars.delete(l);
      weg?.();
      window.removeEventListener("storage", opStorage);
    };
  }

  return {
    startPad,
    wijzigChats,
    bewaar,
    /**
     * Voegt berichten toe aan het actieve gesprek, of begint een nieuw gesprek. `sluitSessie` maakt eerdere
     * oefenblokken van die sessie af (die tonen dan alleen de vraagplaatsen tot `tot`).
     */
    voegToeAanActief(nieuw: Bericht[], opties: { titel?: string; sluitSessie?: { id: string; tot: number } } = {}) {
      const d = lees();
      const huidig = d.actief ? d.gesprekken.find((g) => g.id === d.actief) : undefined;
      const basis: Gesprek = huidig ?? { id: crypto.randomUUID(), titel: maakTitel(opties.titel ?? nieuw[0]?.tekst ?? ""), berichten: [], bijgewerkt: Date.now() };
      const s = opties.sluitSessie;
      const berichten = s ? basis.berichten.map((b) => (b.oefening?.sessieId === s.id && b.oefening.tot === undefined ? { ...b, oefening: { ...b.oefening, tot: s.tot } } : b)) : basis.berichten;
      bewaar({ ...basis, berichten: [...berichten, ...nieuw], bijgewerkt: Date.now() });
    },
    /** Nieuwe chat: het lege startscherm. Eerdere gesprekken blijven staan. */
    nieuweChat: () => wijzigChats((d) => ({ ...d, actief: null })),
    openChat: (id: string) => wijzigChats((d) => ({ ...d, actief: id })),
    /** Nieuwe naam voor een gesprek. Leeg laat de oude naam staan. */
    hernoemChat(id: string, titel: string) {
      if (!titel.trim()) return;
      const schoon = maakTitel(titel);
      wijzigChats((d) => ({ ...d, gesprekken: d.gesprekken.map((g) => (g.id === id ? { ...g, titel: schoon } : g)) }));
    },
    /** Archiveren of terugzetten. Een gearchiveerd gesprek dat openstaat, wordt gesloten. */
    archiveerChat(id: string, gearchiveerd: boolean) {
      wijzigChats((d) => ({ gesprekken: d.gesprekken.map((g) => (g.id === id ? { ...g, gearchiveerd } : g)), actief: gearchiveerd && d.actief === id ? null : d.actief }));
    },
    verwijderChat: (id: string) => wijzigChats((d) => ({ gesprekken: d.gesprekken.filter((g) => g.id !== id), actief: d.actief === id ? null : d.actief })),
    /** Alles van deze winkel van het apparaat wissen. */
    wis() {
      try {
        window.localStorage.removeItem(sleutel());
      } catch {}
      cache = null;
      meld();
    },
    /** De gesprekken, of null tijdens server-rendering en de eerste render. */
    useChats(): ChatOpslag | null {
      return useSyncExternalStore(abonneer, lees, () => null);
    },
  };
}

export type ChatWinkel = ReturnType<typeof maakChatWinkel>;

/** Chats van het kind (of de gast) dat nu oefent. */
export const kindChats = maakChatWinkel({
  sleutel: () => {
    const kind = actiefProfiel();
    return kind ? `mees:kind:${kind}:chats:v1` : "mees:gast:chats:v1";
  },
  cookie: GESPREK_OPEN_COOKIE,
  alsProfielWisselt: abonneerOpslag,
  startPad: "/kind/start",
});

/** Chats van de ouder op dit apparaat (gewist bij uitloggen). */
export const OUDER_CHATS = "mees:ouder:chats:v1";
export const ouderChats = maakChatWinkel({ sleutel: () => OUDER_CHATS, startPad: "/ouder" });

/** Welke chatgeschiedenis de gedeelde onderdelen (menu, zoeken, naam wijzigen) gebruiken. */
export const ChatWinkelContext = createContext<ChatWinkel>(kindChats);
export const useChatWinkel = () => use(ChatWinkelContext);

// Vertrouwde namen voor het kindergedeelte.
export const { wijzigChats, bewaar, voegToeAanActief, nieuweChat, openChat, hernoemChat, archiveerChat, verwijderChat } = kindChats;
export const useChats = kindChats.useChats;
/** Gastgesprekken wissen ("Begin opnieuw"); een actief kinderprofiel blijft ongemoeid. */
export const wisGastChats = () => {
  if (!actiefProfiel()) return kindChats.wis();
  try {
    window.localStorage.removeItem("mees:gast:chats:v1");
  } catch {}
};
