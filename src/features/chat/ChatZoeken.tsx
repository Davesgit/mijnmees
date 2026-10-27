"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialoog } from "@/components/mees/Dialoog";
import { Icoon } from "@/components/mees/Icoon";
import type { Gesprek } from "./gesprek";
import { wanneer } from "./tijd";
import { useChatWinkel } from "./opslag";

const schoon = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Waar in het gesprek de zoekterm staat: de titel, of een stukje uit een bericht. */
function zoekIn(g: Gesprek, term: string): { gevonden: boolean; fragment?: string } {
  if (!term) return { gevonden: true };
  if (schoon(g.titel).includes(term)) return { gevonden: true };
  for (const b of g.berichten) {
    const i = schoon(b.tekst).indexOf(term);
    if (i >= 0) {
      const begin = Math.max(0, i - 30);
      return { gevonden: true, fragment: `${begin > 0 ? "…" : ""}${b.tekst.slice(begin, i + term.length + 40).trim()}…` };
    }
  }
  return { gevonden: false };
}

/** Chats zoeken, zoals in AI-chats: op titel en op wat er in het gesprek staat. Gearchiveerde chats komen ook mee. */
export function ZoekChats({ open, pad, onSluit, onGekozen }: { open: boolean; /** De huidige pagina. */ pad: string; onSluit: () => void; onGekozen?: () => void }) {
  const router = useRouter();
  const winkel = useChatWinkel();
  const chats = winkel.useChats();
  const [zoekterm, setZoekterm] = useState("");
  const term = schoon(zoekterm.trim());
  const resultaten = (chats?.gesprekken ?? []).map((g) => ({ g, ...zoekIn(g, term) })).filter((r) => r.gevonden);

  function kies(id: string) {
    winkel.openChat(id);
    setZoekterm("");
    onSluit();
    onGekozen?.();
    if (pad !== winkel.startPad) router.push(winkel.startPad);
  }

  return (
    <Dialoog open={open} onSluit={onSluit} titel="Chats zoeken">
      <label htmlFor="chats-zoeken" className="sr-only">
        Zoek in je chats
      </label>
      <div className="flex items-center gap-2 rounded-full border-2 border-rand-interactief px-4 focus-within:border-actie-blauw">
        <Icoon naam="zoek" className="size-5 shrink-0 text-tekst-zacht" />
        <input
          id="chats-zoeken"
          type="search"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          placeholder="Waar wil je naar zoeken?"
          autoComplete="off"
          autoFocus
          className="min-h-12 w-full bg-transparent text-lg outline-none focus-visible:outline-none"
        />
      </div>
      <ul className="mt-4 flex max-h-[50dvh] flex-col gap-1 overflow-y-auto" aria-live="polite">
        {resultaten.length === 0 ? (
          <li className="px-2 py-3 text-tekst-zacht">{chats?.gesprekken.length ? "Geen chats gevonden." : "Je hebt nog geen chats."}</li>
        ) : (
          resultaten.map(({ g, fragment }) => (
            <li key={g.id}>
              <button type="button" onClick={() => kies(g.id)} className="flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left hover:bg-blauw-zacht">
                <Icoon naam={g.gearchiveerd ? "archief" : "chat"} className="mt-0.5 size-5 shrink-0 text-actie-blauw" />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{g.titel}</span>
                  {fragment && <span className="block truncate tekst-klein text-tekst-zacht">{fragment}</span>}
                  <span className="block tekst-klein text-tekst-zacht">
                    {wanneer(g.bijgewerkt)}
                    {g.gearchiveerd ? " · gearchiveerd" : ""}
                  </span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      <Link
        href={winkel.startPad === "/ouder" ? "/ouder/chats" : "/kind/chats"}
        onClick={() => {
          onSluit();
          onGekozen?.();
        }}
        className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-[12px] px-2 font-semibold text-actie-blauw hover:bg-blauw-zacht"
      >
        <Icoon naam="archief" className="size-5" />
        Alle chats en het archief
      </Link>
    </Dialoog>
  );
}
