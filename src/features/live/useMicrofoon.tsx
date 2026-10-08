"use client";

import { useEffect, useRef, useState } from "react";

export function kiesMime() {
  if (typeof MediaRecorder === "undefined") return null;
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm", "audio/aac"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

/** Microfoon met niveaumeter: toestemming vragen, geweigerd/geen microfoon netjes melden. */
export function useMicrofoon() {
  const [stroom, setStroom] = useState<MediaStream | null>(null);
  const [niveau, setNiveau] = useState(0);
  const [fout, setFout] = useState<string | null>(null);
  const meter = useRef<{ ctx: AudioContext; frame: number } | null>(null);

  function stopMeter() {
    if (meter.current) {
      cancelAnimationFrame(meter.current.frame);
      meter.current.ctx.close().catch(() => {});
      meter.current = null;
    }
  }

  async function start() {
    setFout(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setFout("Deze browser kan geen microfoon gebruiken. Gebruik een recente Chrome, Edge, Firefox of Safari.");
      return null;
    }
    let s: MediaStream;
    try {
      s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      setFout((e as DOMException).name === "NotAllowedError" ? "Mees mag de microfoon niet gebruiken. Sta de microfoon toe in je browser en probeer opnieuw." : "Er is geen microfoon gevonden. Sluit een microfoon aan en probeer opnieuw.");
      return null;
    }
    stopMeter();
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(s).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const lees = () => {
      analyser.getByteTimeDomainData(data);
      let piek = 0;
      for (const v of data) piek = Math.max(piek, Math.abs(v - 128));
      setNiveau(Math.min(1, piek / 64));
      if (meter.current) meter.current.frame = requestAnimationFrame(lees);
    };
    meter.current = { ctx, frame: requestAnimationFrame(lees) };
    setStroom(s);
    return s;
  }

  function stop() {
    stopMeter();
    stroom?.getTracks().forEach((t) => t.stop());
    setStroom(null);
  }

  useEffect(
    () => () => {
      stopMeter();
    },
    [],
  );

  return { stroom, niveau, fout, start, stop };
}

export function Niveaumeter({ niveau }: { niveau: number }) {
  return (
    <span className="h-3 w-40 overflow-hidden rounded-full bg-uitgeschakeld-vlak" role="meter" aria-label="Microfoonniveau" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(niveau * 100)}>
      <span className="block h-full bg-succes transition-[width] duration-75" style={{ width: `${niveau * 100}%` }} />
    </span>
  );
}
