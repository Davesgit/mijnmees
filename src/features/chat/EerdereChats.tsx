"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { ChatMenu, NaamVeld } from "./ChatOpties";
import type { Gesprek } from "./gesprek";
import { wanneer } from "./tijd";
import { useChatWinkel } from "./opslag";

/** Alle eerdere gesprekken met Mees op dit apparaat, met gearchiveerde chats apart. */
export function EerdereChats() {
  const router = useRouter();
  const winkel = useChatWinkel();
  const chats = winkel.useChats();
  const [hernoemId, setHernoemId] = useState<string | null>(null);
  const [archiefOpen, setArchiefOpen] = useState(false);

  if (chats === null) return <div className="chat-achtergrond flex-1" aria-hidden />;
  const gewoon = chats.gesprekken.filter((g) => !g.gearchiveerd);
  const archief = chats.gesprekken.filter((g) => g.gearchiveerd);

  const rij = (g: Gesprek) => (
    <li key={g.id} className="flex items-center gap-2 rounded-[20px] border border-[#e9f5ff] bg-wit p-2 shadow-[0_8px_24px_#92c5eb13]">
      {hernoemId === g.id ? (
        <div className="flex min-h-14 min-w-0 flex-1 items-center gap-4 px-3">
          <Icoon naam="chat" className="size-6 shrink-0 text-actie-blauw" />
          <NaamVeld gesprek={g} onKlaar={() => setHernoemId(null)} className="w-full text-lg" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            winkel.openChat(g.id);
            router.push(winkel.startPad);
          }}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-4 rounded-[14px] px-3 text-left hover:bg-[#f1f9ff]"
        >
          <Icoon naam={g.gearchiveerd ? "archief" : "chat"} className="size-6 shrink-0 text-actie-blauw" />
          <span className="min-w-0">
            <span className="block truncate font-bold">{g.titel}</span>
            <span className="block tekst-klein text-tekst-zacht">{wanneer(g.bijgewerkt)}</span>
          </span>
        </button>
      )}
      <ChatMenu gesprek={g} onHernoem={() => setHernoemId(g.id)} className="size-12" />
    </li>
  );

  return (
    <div className="chat-achtergrond flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[860px] px-4 py-6 tablet:px-8 tablet:py-10">
        <h1 className="titel-pagina">Eerdere chats</h1>
        <p className="mt-1 text-tekst-zacht">Je gesprekken met Mees blijven op dit apparaat bewaard. Met de drie puntjes kun je een chat een andere naam geven, archiveren of verwijderen.</p>

        {gewoon.length === 0 ? (
          <div className="mt-6 rounded-[20px] bg-wit p-6">
            <p>{archief.length ? "Al je chats staan in het archief." : "Je hebt nog geen gesprekken met Mees."}</p>
            <PrimaireKnop
              className="mt-4"
              onClick={() => {
                winkel.nieuweChat();
                router.push(winkel.startPad);
              }}
            >
              Begin een gesprek
            </PrimaireKnop>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">{gewoon.map(rij)}</ul>
        )}

        {archief.length > 0 && (
          <section className="mt-8">
            <button
              type="button"
              onClick={() => setArchiefOpen((o) => !o)}
              aria-expanded={archiefOpen}
              className="flex min-h-12 items-center gap-2 rounded-[12px] px-2 font-bold text-inkt hover:bg-blauw-zacht"
            >
              <Icoon naam="archief" className="size-5 text-actie-blauw" />
              Gearchiveerd ({archief.length})
              <Icoon naam="chevron-omlaag" className={`size-5 transition-transform ${archiefOpen ? "rotate-180" : ""}`} />
            </button>
            {archiefOpen && <ul className="mt-2 flex flex-col gap-2">{archief.map(rij)}</ul>}
          </section>
        )}
      </div>
    </div>
  );
}
