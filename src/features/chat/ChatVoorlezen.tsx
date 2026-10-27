"use client";

import { createContext, use } from "react";
import { Icoon } from "@/components/mees/Icoon";

// Eén voorleesstem voor het hele gesprek: er leest altijd maar één bericht tegelijk voor.
export type ChatVoorlezen = { leestId: string | null; bezig: boolean; laadt: boolean; lees: (id: string, tekst: string) => void };

export const ChatVoorleesContext = createContext<ChatVoorlezen>({ leestId: null, bezig: false, laadt: false, lees: () => {} });

/** Knop "Voorlezen" onder een bericht van Mees. Alleen na een tik; nogmaals tikken stopt. */
export function VoorleesLink({ id, tekst }: { id: string; tekst: string }) {
  const v = use(ChatVoorleesContext);
  const leest = v.leestId === id && v.bezig;
  const laadt = v.leestId === id && v.laadt;
  return (
    <button
      type="button"
      onClick={() => v.lees(id, tekst)}
      aria-pressed={leest}
      className="inline-flex min-h-10 items-center gap-2 rounded-[10px] px-2 tekst-klein font-semibold text-actie-blauw hover:bg-blauw-zacht"
    >
      <Icoon naam={leest ? "stop" : "voorlezen"} className={`size-5 ${laadt ? "animate-pulse" : ""}`} />
      {laadt ? "Even laden…" : leest ? "Stoppen" : "Voorlezen"}
    </button>
  );
}

/** Afzender van elk Mees-bericht: het vogeltje en de naam. */
export function MeesAfzender() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-full bg-blauw-zacht" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/merk/mees-vogel.png" alt="" className="h-5 w-auto" />
      </span>
      <strong className="tekst-klein">Mees</strong>
    </div>
  );
}
