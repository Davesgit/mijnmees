"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { UitlogKnop } from "@/app/ouder/UitlogKnop";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { ChatSchil, type SchilInstelling } from "@/features/chat/KindSchil";
import { ouderChats } from "@/features/chat/opslag";

const vast: { label: string; href: string; icoon: AlleIcoonNamen }[] = [
  { label: "Naar de kinderen", href: "/profielen", icoon: "persoon" },
  { label: "Instellingen", href: "/ouder/instellingen", icoon: "leesopties" },
  { label: "Privacy", href: "/ouder/privacy", icoon: "slot" },
];

/** Schil van de ouderomgeving: dezelfde chat als bij kinderen, met een eigen chatgeschiedenis en vast onderin de ouderzaken. */
export function OuderSchil({ children }: { children: ReactNode }) {
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
    onderkant: (naKeuze, pad) => (
      <>
        {vast.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={naKeuze}
            aria-current={pad.startsWith(l.href) ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 tekst-klein font-semibold hover:bg-blauw-zacht hover:text-actie-blauw ${pad.startsWith(l.href) ? "bg-[#e4f4ff] text-actie-blauw" : "text-tekst-zacht"}`}
          >
            <Icoon naam={l.icoon} className="size-5" />
            {l.label}
          </Link>
        ))}
        <UitlogKnop label="Uitloggen" />
      </>
    ),
  };
  return <ChatSchil instelling={instelling}>{children}</ChatSchil>;
}
