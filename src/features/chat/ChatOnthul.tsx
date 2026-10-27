"use client";

import { createContext, use, useLayoutEffect, useRef, type ReactNode } from "react";
import { meesTypt, TIK_MS } from "./ritme";

// Kaarten van Mees opbouwen zoals in een AI-chat: blok voor blok, tekst woord voor woord. Alleen voor nieuwe
// reacties (de context zegt of iets net verschijnt); bij herladen of een oud gesprek staat alles er meteen.

/** True als de kaart net als reactie verschijnt: dan typt Mees de inhoud. */
export const NieuweReactie = createContext(false);

/**
 * Bouwt een kaart van Mees op zoals in een AI-chat: blok voor blok, met de tekst woord voor woord.
 * Werkt op de getekende inhoud, zodat ook breuken en opmaak gewoon meelopen. Knoppen komen als laatste.
 */
export function TypOnthul({ className = "", children }: { className?: string; children: ReactNode }) {
  const typen = use(NieuweReactie);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!typen || !root) return;
    const blokken = [...root.children] as HTMLElement[];
    const plan = blokken.map((blok) => {
      const teksten: { node: Text; volledig: string; delen: string[] }[] = [];
      const w = document.createTreeWalker(blok, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const node = w.currentNode as Text;
        teksten.push({ node, volledig: node.data, delen: node.data.split(/(\s+)/) });
        node.data = "";
      }
      blok.style.visibility = "hidden";
      return { blok, teksten };
    });
    const afmelden = meesTypt();
    const klaar = () => {
      clearInterval(iv);
      afmelden();
    };
    let b = 0;
    let t = 0;
    let d = 0;
    const iv = setInterval(() => {
      // Twee delen per tik: een woord en de spatie erna.
      for (let stap = 0; stap < 2; stap++) {
        const blok = plan[b];
        if (!blok) return klaar();
        blok.blok.style.visibility = "";
        const tekst = blok.teksten[t];
        if (!tekst) {
          b++;
          t = 0;
          d = 0;
          continue;
        }
        const deel = tekst.delen[d];
        if (deel === undefined) {
          t++;
          d = 0;
          continue;
        }
        tekst.node.data += deel;
        d++;
      }
    }, TIK_MS);
    return () => {
      klaar();
      for (const p of plan) {
        p.blok.style.visibility = "";
        for (const x of p.teksten) x.node.data = x.volledig;
      }
    };
  }, [typen]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

