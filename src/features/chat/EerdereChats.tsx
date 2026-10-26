"use client";

import { useRouter } from "next/navigation";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { wanneer } from "./KindSchil";
import { nieuweChat, openChat, useChats, verwijderChat } from "./opslag";

/** Alle eerdere gesprekken met Mees op dit apparaat. */
export function EerdereChats() {
  const router = useRouter();
  const chats = useChats();

  return (
    <div className="chat-achtergrond flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[860px] px-4 py-6 tablet:px-8 tablet:py-10">
        <h1 className="titel-pagina">Eerdere chats</h1>
        <p className="mt-1 text-tekst-zacht">Je gesprekken met Mees blijven op dit apparaat bewaard.</p>
        {chats === null ? null : chats.gesprekken.length === 0 ? (
          <div className="mt-6 rounded-[20px] bg-wit p-6">
            <p>Je hebt nog geen gesprekken met Mees.</p>
            <PrimaireKnop
              className="mt-4"
              onClick={() => {
                nieuweChat();
                router.push("/kind/start");
              }}
            >
              Begin een gesprek
            </PrimaireKnop>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {chats.gesprekken.map((g) => (
              <li key={g.id} className="flex items-center gap-2 rounded-[20px] border border-[#e9f5ff] bg-wit p-2 shadow-[0_8px_24px_#92c5eb13]">
                <button
                  type="button"
                  onClick={() => {
                    openChat(g.id);
                    router.push("/kind/start");
                  }}
                  className="flex min-h-14 min-w-0 flex-1 items-center gap-4 rounded-[14px] px-3 text-left hover:bg-[#f1f9ff]"
                >
                  <Icoon naam="chat" className="size-6 shrink-0 text-actie-blauw" />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{g.titel}</span>
                    <span className="block tekst-klein text-tekst-zacht">{wanneer(g.bijgewerkt)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => verwijderChat(g.id)}
                  aria-label={`Verwijder ${g.titel}`}
                  title="Verwijderen"
                  className="grid size-12 shrink-0 place-items-center rounded-full text-tekst-zacht hover:bg-blauw-zacht hover:text-fout"
                >
                  <Icoon naam="prullenbak" className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
