"use client";

import { useEffect, useRef, useState } from "react";
import { tekstVoorVoorlezen } from "./Breuk";
import { Icoon } from "./Icoon";

type Status = "uit" | "laden" | "leest";

/**
 * Voorlezen, alleen na een bewuste klik (ontwerpregels §12). Eerst de natuurlijke stem (ElevenLabs, via de server);
 * lukt dat niet, dan de systeemstem van het apparaat. Zo werkt voorlezen altijd.
 */
export function useVoorlezen() {
  const [status, setStatus] = useState<Status>("uit");
  const audio = useRef<HTMLAudioElement | null>(null);
  const poging = useRef(0);

  function stop() {
    poging.current++;
    audio.current?.pause();
    audio.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setStatus("uit");
  }

  useEffect(() => stop, []);

  function systeemstem(tekst: string) {
    if (!("speechSynthesis" in window)) return setStatus("uit");
    const synth = window.speechSynthesis;
    synth.cancel();
    const uiting = new SpeechSynthesisUtterance(tekstVoorVoorlezen(tekst));
    uiting.lang = "nl-NL";
    const stem = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("nl"));
    if (stem) uiting.voice = stem;
    uiting.rate = 0.95;
    uiting.onend = () => setStatus("uit");
    uiting.onerror = () => setStatus("uit");
    setStatus("leest");
    synth.speak(uiting);
  }

  async function lees(tekst: string) {
    if (status !== "uit") return stop();
    const mijn = ++poging.current;
    setStatus("laden");
    // Audio-element meteen bij de klik maken: dan mag de browser hem straks afspelen.
    const speler = new Audio();
    audio.current = speler;
    try {
      const a = await fetch("/api/voorlezen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tekst }) });
      if (mijn !== poging.current) return;
      if (!a.ok) throw new Error();
      const bron = a.headers.get("Content-Type")?.includes("audio") ? URL.createObjectURL(await a.blob()) : ((await a.json()) as { url: string }).url;
      if (mijn !== poging.current) return;
      speler.src = bron;
      speler.onended = () => setStatus("uit");
      speler.onerror = () => {
        if (mijn === poging.current) systeemstem(tekst);
      };
      await speler.play();
      setStatus("leest");
    } catch {
      if (mijn === poging.current) systeemstem(tekst);
    }
  }

  return { status, bezig: status !== "uit", lees };
}

export function VoorleesKnop({ tekst, className = "", compact = false }: { tekst: string; className?: string; compact?: boolean }) {
  const { status, bezig, lees } = useVoorlezen();
  const label = status === "laden" ? "Even laden…" : bezig ? "Stop voorlezen" : "Voorlezen";
  return (
    <button
      type="button"
      onClick={() => void lees(tekst)}
      aria-pressed={bezig}
      aria-busy={status === "laden" || undefined}
      className={`inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-[12px] border border-rand-zacht bg-wit px-3 tablet:px-4 knoptekst text-inkt hover:bg-blauw-zacht ${className}`}
    >
      <Icoon naam={bezig ? "stop" : "voorlezen"} className={`size-6 text-actie-blauw ${status === "laden" ? "animate-pulse" : ""}`} />
      <span className={compact ? "max-desktop:sr-only" : ""}>{label}</span>
    </button>
  );
}
