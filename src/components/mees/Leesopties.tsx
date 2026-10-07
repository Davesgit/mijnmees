"use client";

import { useEffect, useState } from "react";
import type { Leesinstellingen } from "@/features/oefenen/types";
import { useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";
import { Dialoog } from "./Dialoog";
import { Icoon } from "./Icoon";
import { PrimaireKnop } from "./Knoppen";

/** Zet de leesinstellingen als data-attributen op <html>, zodat CSS ze overal toepast. */
export function LeesinstellingenToepasser() {
  const opslag = useOpslag();
  const inst = opslag?.instellingen;
  useEffect(() => {
    if (!inst) return;
    const html = document.documentElement;
    html.dataset.groteTekst = String(inst.groteTekst);
    html.dataset.rustigeOvergangen = String(inst.rustigeOvergangen);
  }, [inst]);
  return null;
}

const opties: { sleutel: keyof Leesinstellingen; label: string; uitleg: string }[] = [
  { sleutel: "groteTekst", label: "Grotere tekst", uitleg: "Alle tekst wordt wat groter." },
  { sleutel: "rustigeOvergangen", label: "Rustige overgangen", uitleg: "Geen bewegende effecten." },
  { sleutel: "rustigVerder", label: "Rustig verder", uitleg: "Na een goed antwoord kies je zelf wanneer je verdergaat." },
];

export function LeesoptiesKnop({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const opslag = useOpslag();
  const inst = opslag?.instellingen;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-[12px] border border-rand-zacht bg-wit px-3 tablet:px-4 knoptekst text-inkt hover:bg-blauw-zacht ${className}`}
      >
        <Icoon naam="leesopties" className="size-6 text-actie-blauw" />
        <span className={compact ? "max-desktop:sr-only" : ""}>Leesopties</span>
      </button>
      <Dialoog open={open} onSluit={() => setOpen(false)} titel="Leesopties">
        <fieldset>
          <legend className="sr-only">Kies je leesopties</legend>
          <ul className="flex flex-col gap-3">
            {opties.map((o) => (
              <li key={o.sleutel}>
                <label className="flex min-h-12 cursor-pointer items-start gap-4 rounded-[12px] border border-rand-zacht p-4 has-[:checked]:border-2 has-[:checked]:border-actie-blauw has-[:checked]:bg-blauw-zacht">
                  <input
                    type="checkbox"
                    className="mt-1 size-6 shrink-0 accent-actie-blauw"
                    checked={inst?.[o.sleutel] ?? false}
                    onChange={(e) =>
                      wijzigOpslag((d) => ({ ...d, instellingen: { ...d.instellingen, [o.sleutel]: e.target.checked } }))
                    }
                  />
                  <span>
                    <span className="block font-bold">{o.label}</span>
                    <span className="block tekst-klein text-tekst-zacht">{o.uitleg}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <PrimaireKnop className="mt-6 w-full tablet:w-auto" onClick={() => setOpen(false)}>
          Klaar
        </PrimaireKnop>
      </Dialoog>
    </>
  );
}
