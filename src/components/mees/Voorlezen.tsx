"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { tekstVoorVoorlezen } from "./Breuk";
import { Icoon } from "./Icoon";

const geenAbonnement = () => () => {};

/** Voorlezen met de systeemstem van het apparaat; alleen na een bewuste klik (ontwerpregels §12). */
export function useVoorlezen() {
  const ondersteund = useSyncExternalStore(
    geenAbonnement,
    () => "speechSynthesis" in window,
    () => false,
  );
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function lees(tekst: string) {
    if (!ondersteund) return;
    const synth = window.speechSynthesis;
    if (bezig) {
      synth.cancel();
      setBezig(false);
      return;
    }
    synth.cancel();
    const uiting = new SpeechSynthesisUtterance(tekstVoorVoorlezen(tekst));
    uiting.lang = "nl-NL";
    const stem = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("nl"));
    if (stem) uiting.voice = stem;
    uiting.rate = 0.95;
    uiting.onend = () => setBezig(false);
    uiting.onerror = () => setBezig(false);
    setBezig(true);
    synth.speak(uiting);
  }

  return { ondersteund, bezig, lees };
}

export function VoorleesKnop({ tekst, className = "", compact = false }: { tekst: string; className?: string; compact?: boolean }) {
  const { ondersteund, bezig, lees } = useVoorlezen();
  return (
    <button
      type="button"
      onClick={() => lees(tekst)}
      disabled={!ondersteund}
      aria-pressed={bezig}
      title={ondersteund ? undefined : "Voorlezen werkt niet in deze browser."}
      className={`inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-[12px] border border-rand-zacht bg-wit px-3 tablet:px-4 knoptekst text-inkt hover:bg-blauw-zacht disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst ${className}`}
    >
      <Icoon naam={bezig ? "stop" : "voorlezen"} className="size-6 text-actie-blauw" />
      <span className={compact ? "max-desktop:sr-only" : ""}>{bezig ? "Stop voorlezen" : "Voorlezen"}</span>
    </button>
  );
}
