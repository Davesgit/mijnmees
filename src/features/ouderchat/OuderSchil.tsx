"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { UitlogKnop } from "@/app/ouder/UitlogKnop";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { ChatSchil, type SchilInstelling } from "@/features/chat/KindSchil";
import { ouderChats } from "@/features/chat/opslag";

/** Schil van de ouderomgeving: dezelfde chat als bij kinderen, met een eigen chatgeschiedenis. Onderin vast:
 * "Naar de kinderen" en de ouderknop met Kinderen beheren, Instellingen, Privacy en Uitloggen (zoals in AI-chats). */
export function OuderSchil({ email, children }: { email: string | null; children: ReactNode }) {
  const router = useRouter();
  const instelling: SchilInstelling = {
    winkel: ouderChats,
    voortgang: {
      label: "Voortgang",
      actie: () => {
        ouderChats.nieuweChat();
        router.push("/ouder?vraag=voortgang");
      },
    },
    onderkant: (naKeuze) => (
      <>
        <Link
          href="/profielen"
          onClick={naKeuze}
          className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 tekst-klein font-semibold text-tekst-zacht hover:bg-blauw-zacht hover:text-actie-blauw"
        >
          <Icoon naam="persoon" className="size-5" />
          Naar de kinderen
        </Link>
        <OuderMenu email={email} naKeuze={naKeuze} />
      </>
    ),
  };
  return <ChatSchil instelling={instelling}>{children}</ChatSchil>;
}

const menuItems: { label: string; href: string; icoon: AlleIcoonNamen }[] = [
  { label: "Kinderen beheren", href: "/ouder/instellingen#kinderen-titel", icoon: "persoon" },
  { label: "Instellingen", href: "/ouder/instellingen", icoon: "leesopties" },
  { label: "Privacy", href: "/ouder/privacy", icoon: "slot" },
];

/** De ouderknop onderin het menu; klapt naar boven open. */
function OuderMenu({ email, naKeuze }: { email: string | null; naKeuze: () => void }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const knop = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const buiten = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const toets = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        knop.current?.focus();
      }
    };
    document.addEventListener("pointerdown", buiten);
    document.addEventListener("keydown", toets);
    return () => {
      document.removeEventListener("pointerdown", buiten);
      document.removeEventListener("keydown", toets);
    };
  }, [open]);

  const letter = (email?.[0] ?? "O").toUpperCase();
  return (
    <div ref={wrapper} className="relative">
      <button
        ref={knop}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full items-center gap-3 rounded-[16px] p-2 text-left hover:bg-blauw-zacht"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-inkt font-extrabold text-wit" aria-hidden>
          {letter}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block font-bold">Ouder</span>
          {email && <span className="block truncate tekst-klein text-tekst-zacht">{email}</span>}
        </span>
        <Icoon naam="chevron-omlaag" className={`size-5 shrink-0 transition-transform ${open ? "" : "rotate-180"}`} />
      </button>
      {open && (
        <div id={menuId} className="mees-verschijn absolute bottom-full left-0 z-40 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-[16px] border border-rand-zacht bg-wit p-1.5 shadow-zwevend">
          {menuItems.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => {
                setOpen(false);
                naKeuze();
              }}
              className="flex min-h-12 items-center gap-3 rounded-[10px] px-3 font-semibold text-inkt hover:bg-blauw-zacht"
            >
              <Icoon naam={m.icoon} className="size-5 text-[#6574ac]" />
              {m.label}
            </Link>
          ))}
          <div className="mt-1 border-t border-rand-zacht pt-1">
            <UitlogKnop label="Uitloggen" />
          </div>
        </div>
      )}
    </div>
  );
}
