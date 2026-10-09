"use client";

import { useEffect, useRef, useState } from "react";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { useSchermAan } from "@/components/mees/useSchermAan";
import { BordWeergave } from "./BordWeergave";
import { bordEind, bordOp, type BordOpname } from "./bord";

const tijd = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

/**
 * Speelt tutorstem en bord synchroon af. De audio is de klok; zonder (werkend) geluid loopt een eigen klok,
 * zodat bord en meelees-tekst altijd bruikbaar blijven. Afspelen start pas na een tik (geen autoplay).
 */
export function UitlegSpeler({ titel, bord, duurMs, audioUrl, transcript }: { titel: string; bord: BordOpname; duurMs: number; audioUrl: string | null; transcript: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const kader = useRef<HTMLDivElement>(null);
  const [positie, setPositie] = useState<number | null>(null);
  const [speelt, setSpeelt] = useState(false);
  const [geluidFout, setGeluidFout] = useState(!audioUrl);
  const [meelezen, setMeelezen] = useState(false);
  const eigenKlok = useRef<{ start: number; vanaf: number } | null>(null);
  useSchermAan(speelt);

  const totaal = Math.max(duurMs, 1);
  const nu = positie ?? totaal;
  const elementen = positie === null ? bordEind(bord) : bordOp(bord, nu);

  useEffect(() => {
    if (!speelt) return;
    let frame = 0;
    const tik = () => {
      let ms: number;
      if (!geluidFout && audio.current) ms = audio.current.currentTime * 1000;
      else ms = eigenKlok.current ? eigenKlok.current.vanaf + performance.now() - eigenKlok.current.start : 0;
      if (ms >= totaal) {
        setPositie(totaal);
        setSpeelt(false);
        return;
      }
      setPositie(ms);
      frame = requestAnimationFrame(tik);
    };
    frame = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(frame);
  }, [speelt, geluidFout, totaal]);

  async function speel() {
    const vanaf = positie === null || positie >= totaal ? 0 : positie;
    setPositie(vanaf);
    if (!geluidFout && audio.current) {
      audio.current.currentTime = vanaf / 1000;
      try {
        await audio.current.play();
      } catch {
        setGeluidFout(true);
      }
    }
    eigenKlok.current = { start: performance.now(), vanaf };
    setSpeelt(true);
  }
  function pauzeer() {
    audio.current?.pause();
    setSpeelt(false);
  }
  function spoel(ms: number) {
    const doel = Math.max(0, Math.min(totaal, ms));
    setPositie(doel);
    if (audio.current && !geluidFout) audio.current.currentTime = doel / 1000;
    eigenKlok.current = { start: performance.now(), vanaf: doel };
  }
  function volledigScherm() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else kader.current?.requestFullscreen?.().catch(() => {});
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={kader} className="flex flex-col justify-center bg-wit [&:fullscreen]:p-4">
        <BordWeergave elementen={elementen} label={`Tekenbord: ${titel}`} />
      </div>
      {audioUrl && (
        <audio ref={audio} src={audioUrl} preload="metadata" onEnded={() => setSpeelt(false)} onError={() => setGeluidFout(true)} className="hidden" />
      )}

      <div className="flex flex-wrap items-center gap-3">
        {speelt ? (
          <PrimaireKnop onClick={pauzeer}>
            <Icoon naam="pauze" />
            Pauze
          </PrimaireKnop>
        ) : (
          <PrimaireKnop onClick={speel}>
            <Icoon naam="start" />
            {positie !== null && positie > 0 && positie < totaal ? "Verder afspelen" : "Afspelen"}
          </PrimaireKnop>
        )}
        <label className="flex min-w-48 flex-1 items-center gap-3">
          <span className="sr-only">Positie in de uitleg</span>
          <input
            type="range"
            min={0}
            max={totaal}
            step={250}
            value={Math.round(nu)}
            onChange={(e) => spoel(Number(e.target.value))}
            className="h-12 flex-1 accent-actie-blauw"
            aria-valuetext={`${tijd(nu)} van ${tijd(totaal)}`}
          />
          <span className="tekst-klein tabular-nums text-tekst-zacht">
            {tijd(nu)} / {tijd(totaal)}
          </span>
        </label>
        <SecundaireKnop onClick={volledigScherm}>
          <Icoon naam="kader" />
          Volledig scherm
        </SecundaireKnop>
      </div>

      {geluidFout && <p className="tekst-klein text-tekst-zacht">Het geluid speelt nu niet af. Het bord loopt wel mee, en je kunt de tekst meelezen.</p>}

      {transcript && (
        <div>
          <button type="button" onClick={() => setMeelezen((m) => !m)} aria-expanded={meelezen} className="inline-flex min-h-12 items-center gap-2 rounded-[12px] px-2 font-semibold text-actie-blauw hover:bg-blauw-zacht">
            <Icoon naam="tekst" />
            {meelezen ? "Verberg de tekst" : "Lees mee"}
          </button>
          {meelezen && <p className="mt-2 whitespace-pre-line rounded-[16px] bg-blauw-zacht p-4">{transcript}</p>}
        </div>
      )}
    </div>
  );
}
