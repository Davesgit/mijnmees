"use client";

import { useEffect, useRef, useState } from "react";
import { Dialoog } from "@/components/mees/Dialoog";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { SecundaireKnop } from "@/components/mees/Knoppen";
import type { Gesprek } from "./gesprek";
import { useChatWinkel } from "./opslag";

// Beheer van een gesprek, zoals in AI-chats: drie puntjes met naam wijzigen, archiveren en verwijderen.

/** Invulveld om de naam van een gesprek te wijzigen. Enter of wegklikken bewaart, Escape annuleert. */
export function NaamVeld({ gesprek, onKlaar, className = "" }: { gesprek: Gesprek; onKlaar: () => void; className?: string }) {
  const { hernoemChat } = useChatWinkel();
  const [waarde, setWaarde] = useState(gesprek.titel);
  const veld = useRef<HTMLInputElement>(null);
  const klaar = useRef(false);
  useEffect(() => {
    veld.current?.focus();
    veld.current?.select();
  }, []);
  const bewaar = () => {
    if (klaar.current) return;
    klaar.current = true;
    hernoemChat(gesprek.id, waarde);
    onKlaar();
  };
  return (
    <input
      ref={veld}
      value={waarde}
      maxLength={60}
      aria-label="Nieuwe naam van de chat"
      onChange={(e) => setWaarde(e.target.value)}
      onBlur={bewaar}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          bewaar();
        } else if (e.key === "Escape") {
          e.preventDefault();
          klaar.current = true;
          onKlaar();
        }
      }}
      className={`min-w-0 rounded-[10px] border-2 border-actie-blauw bg-wit px-2 py-1 font-semibold outline-none ${className}`}
    />
  );
}

/** De drie puntjes naast een gesprek, met het menu en de bevestiging bij verwijderen. */
export function ChatMenu({ gesprek, onHernoem, className = "" }: { gesprek: Gesprek; onHernoem: () => void; className?: string }) {
  const { archiveerChat, verwijderChat } = useChatWinkel();
  const [plek, setPlek] = useState<{ top: number; left: number } | null>(null);
  const [verwijderVragen, setVerwijderVragen] = useState(false);
  const knop = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const open = plek !== null;

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const sluit = () => setPlek(null);
    const buiten = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !knop.current?.contains(e.target as Node)) sluit();
    };
    const toets = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sluit();
        knop.current?.focus();
      }
    };
    document.addEventListener("pointerdown", buiten);
    document.addEventListener("keydown", toets);
    window.addEventListener("scroll", sluit, true);
    window.addEventListener("resize", sluit);
    return () => {
      document.removeEventListener("pointerdown", buiten);
      document.removeEventListener("keydown", toets);
      window.removeEventListener("scroll", sluit, true);
      window.removeEventListener("resize", sluit);
    };
  }, [open]);

  function wissel() {
    if (open) return setPlek(null);
    const r = knop.current!.getBoundingClientRect();
    // Vaste plek op het scherm (het zijmenu scrolt en zou het menu afsnijden); binnen beeld houden.
    const breedte = 220;
    const hoogte = 170;
    setPlek({
      left: Math.min(Math.max(8, r.right - breedte), window.innerWidth - breedte - 8),
      top: r.bottom + hoogte + 8 > window.innerHeight ? Math.max(8, r.top - hoogte - 4) : r.bottom + 4,
    });
  }

  const item = (icoon: AlleIcoonNamen, tekst: string, actie: () => void, gevaar = false) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setPlek(null);
        actie();
      }}
      className={`flex min-h-12 w-full items-center gap-3 rounded-[10px] px-3 text-left font-semibold hover:bg-blauw-zacht focus-visible:bg-blauw-zacht ${gevaar ? "text-fout" : "text-inkt"}`}
    >
      <Icoon naam={icoon} className="size-5" />
      {tekst}
    </button>
  );

  return (
    <>
      <button
        ref={knop}
        type="button"
        onClick={wissel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Opties voor ${gesprek.titel}`}
        title="Opties"
        className={`grid size-10 shrink-0 place-items-center rounded-full text-[#6574ac] hover:bg-[#dcefff] hover:text-inkt ${open ? "bg-[#dcefff] text-inkt" : ""} ${className}`}
      >
        <Icoon naam="meer" className="size-5" />
      </button>
      {open && (
        <div ref={menu} role="menu" aria-label={`Opties voor ${gesprek.titel}`} className="mees-verschijn fixed z-[60] w-[220px] rounded-[16px] border border-rand-zacht bg-wit p-1.5 shadow-zwevend" style={plek}>
          {item("pen", "Naam wijzigen", onHernoem)}
          {gesprek.gearchiveerd ? item("terugzetten", "Terugzetten", () => archiveerChat(gesprek.id, false)) : item("archief", "Archiveren", () => archiveerChat(gesprek.id, true))}
          {item("prullenbak", "Verwijderen", () => setVerwijderVragen(true), true)}
        </div>
      )}
      <Dialoog open={verwijderVragen} onSluit={() => setVerwijderVragen(false)} titel="Chat verwijderen?">
        <p>
          De chat <strong>{gesprek.titel}</strong> wordt verwijderd. Dit kun je niet terugdraaien. Je oefeningen en voortgang blijven gewoon bewaard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              verwijderChat(gesprek.id);
              setVerwijderVragen(false);
            }}
            className="inline-flex min-h-12 items-center rounded-[12px] bg-fout px-5 font-bold text-wit hover:bg-[#991b1b]"
          >
            Ja, verwijder
          </button>
          <SecundaireKnop onClick={() => setVerwijderVragen(false)}>Nee, terug</SecundaireKnop>
        </div>
      </Dialoog>
    </>
  );
}
