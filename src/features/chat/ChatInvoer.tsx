"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icoon } from "@/components/mees/Icoon";

// Inspreken via de spraakherkenning van de browser: alleen na een tik, tekst komt ter controle in het invoerveld.
type Herkenning = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onstart: (() => void) | null;
};
type HerkenningKlasse = new () => Herkenning;
const herkenningKlasse = () => {
  const w = window as unknown as { SpeechRecognition?: HerkenningKlasse; webkitSpeechRecognition?: HerkenningKlasse };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};
const geenAbonnement = () => () => {};

export function Invoer({ waarde, onWijzig, onStuur, onLuisteren, plaatshouder }: { waarde: string; onWijzig: (t: string) => void; onStuur: () => void; onLuisteren: () => void; plaatshouder: string }) {
  const kanPraten = useSyncExternalStore(geenAbonnement, () => herkenningKlasse() !== null, () => false);
  const smal = useSyncExternalStore(geenAbonnement, () => matchMedia("(max-width: 767px)").matches, () => false);
  const [luistert, setLuistert] = useState(false);
  const [melding, setMelding] = useState("");
  const herkenning = useRef<Herkenning | null>(null);
  const veld = useRef<HTMLInputElement>(null);

  useEffect(() => () => herkenning.current?.abort(), []);

  function praat() {
    if (luistert) {
      herkenning.current?.stop();
      return;
    }
    const Klasse = herkenningKlasse();
    if (!Klasse) return;
    onLuisteren();
    setMelding("");
    const h = new Klasse();
    h.lang = "nl-NL";
    h.interimResults = true;
    h.continuous = false;
    h.onstart = () => setLuistert(true);
    h.onresult = (e) => {
      const tekst = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join("");
      onWijzig(tekst);
    };
    h.onerror = (e) => setMelding(e.error === "not-allowed" || e.error === "service-not-allowed" ? "De microfoon mag niet gebruikt worden. Je kunt ook typen." : "Ik kon je niet goed horen. Probeer het nog eens of typ je vraag.");
    h.onend = () => {
      setLuistert(false);
      veld.current?.focus();
    };
    herkenning.current = h;
    try {
      h.start();
    } catch {
      setMelding("Praten lukt nu niet. Je kunt ook typen.");
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onStuur();
        }}
        className={`flex items-center gap-2 rounded-full bg-wit/95 p-2 shadow-[0_7px_28px_#69b5ec26] tablet:gap-3 tablet:p-3 ${luistert ? "ring-2 ring-actie-blauw" : ""}`}
      >
        {kanPraten && (
          <button
            type="button"
            onClick={praat}
            aria-pressed={luistert}
            aria-label={luistert ? "Stop met luisteren" : "Vraag inspreken"}
            className={`grid size-12 shrink-0 place-items-center rounded-full tablet:size-16 ${luistert ? "bg-actie-blauw text-wit" : "bg-[#e4f5ff] text-actie-blauw hover:bg-[#d4eeff]"}`}
          >
            <Icoon naam={luistert ? "stop" : "microfoon"} className="size-6 tablet:size-7" />
          </button>
        )}
        <label htmlFor="chat-invoer" className="sr-only">
          Je vraag aan Mees
        </label>
        <input
          ref={veld}
          id="chat-invoer"
          value={waarde}
          onChange={(e) => onWijzig(e.target.value)}
          maxLength={500}
          autoComplete="off"
          enterKeyHint="send"
          placeholder={luistert ? "Mees luistert…" : smal ? "Typ je vraag…" : plaatshouder}
          className="min-w-0 flex-1 rounded-full border border-[#edf7ff] bg-transparent px-4 py-3 text-lg placeholder:text-[#6f7db0] tablet:px-5 tablet:py-4 tablet:text-xl"
        />
        <button type="submit" aria-label="Verstuur je vraag" disabled={!waarde.trim()} className="grid size-12 shrink-0 place-items-center rounded-full bg-actie-blauw text-wit hover:bg-[#004fa8] disabled:opacity-50 tablet:size-16">
          <Icoon naam="verstuur" className="size-6 tablet:size-7" />
        </button>
      </form>
      <p role="status" className="mt-2 min-h-5 px-4 tekst-klein text-[#52649b]">
        {luistert ? "Mees luistert… Tik op stop als je klaar bent." : melding}
      </p>
    </div>
  );
}
