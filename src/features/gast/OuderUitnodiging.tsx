"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Icoon } from "@/components/mees/Icoon";

const SLEUTEL = "mees:ouderuitnodiging:getoond";
const vandaag = () => new Date().toISOString().slice(0, 10);
const geenAbonnement = () => () => {};

function alGetoond() {
  try {
    return localStorage.getItem(SLEUTEL) === vandaag();
  } catch {
    return true; // Geen opslag beschikbaar: liever niet steeds tonen.
  }
}

/**
 * "Wil je later verder oefenen?" voor gasten, na een afgeronde oefening (nooit midden in een vraag), hooguit één keer per dag.
 * Mailen naar de ouder is nog niet aangesloten (komt met Resend): er wordt niets verstuurd of bewaard, en dat staat er eerlijk.
 */
export function OuderUitnodiging() {
  const getoond = useSyncExternalStore(geenAbonnement, alGetoond, () => true);
  const [gesloten, setGesloten] = useState(false);
  const [email, setEmail] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [nogNiet, setNogNiet] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const titelId = useId();
  const open = !getoond && !gesloten;

  useEffect(() => {
    const d = ref.current;
    if (!d || !open || d.open) return;
    const t = setTimeout(() => d.showModal(), 600);
    return () => clearTimeout(t);
  }, [open]);

  function sluit() {
    try {
      localStorage.setItem(SLEUTEL, vandaag());
    } catch {}
    ref.current?.close();
    setGesloten(true);
  }

  function verstuur(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setFout("Controleer het e-mailadres van je ouder.");
      return;
    }
    setFout(null);
    setNogNiet(true);
  }

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      aria-labelledby={titelId}
      onClose={sluit}
      onClick={(e) => {
        if (e.target === ref.current) sluit();
      }}
      className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[600px] overflow-y-auto rounded-[24px] bg-wit p-0 text-inkt shadow-zwevend backdrop:bg-inkt/40"
    >
      <div className="relative p-5 text-center tablet:p-8">
        <button type="button" onClick={sluit} aria-label="Sluiten en verder oefenen" className="absolute right-2 top-2 grid size-12 place-items-center rounded-full hover:bg-blauw-zacht tablet:right-4 tablet:top-4">
          <Icoon naam="sluiten" />
        </button>
        <Image src="/assets/popup/mees-bewaart-je-plek.png" alt="" width={1536} height={1024} sizes="(min-width: 768px) 280px, 220px" className="mx-auto w-[220px] object-contain tablet:w-[280px]" />
        <h2 id={titelId} className="mt-2 text-2xl font-extrabold leading-tight tablet:text-[1.75rem]">
          Wil je later verder oefenen?
        </h2>
        <p className="mt-2 text-lg">Met een gratis account onthoudt Mees wat je al hebt geoefend.</p>

        {nogNiet ? (
          <div className="mt-5 rounded-[16px] bg-blauw-zacht p-4 text-left" role="status">
            <p className="font-bold">Mailen naar je ouder kan binnenkort.</p>
            <p className="mt-1">Er is nog niets verstuurd. Vraag je ouder om op mijnmees.nl een gratis account te maken. Daarna kun je op elk apparaat verder.</p>
          </div>
        ) : (
          <form onSubmit={verstuur} noValidate className="mt-5 flex flex-col gap-2 text-left">
            <label htmlFor="ouder-email" className="font-bold">
              E-mailadres van je ouder
            </label>
            <input
              id="ouder-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ouder@voorbeeld.nl"
              aria-invalid={fout ? true : undefined}
              aria-describedby={`ouder-email-hulp${fout ? " ouder-email-fout" : ""}`}
              className={`min-h-12 rounded-[12px] border bg-wit px-4 text-lg ${fout ? "border-2 border-fout" : "border-rand-interactief"}`}
            />
            <p id="ouder-email-hulp" className="tekst-klein text-tekst-zacht">
              Je ouder krijgt een mail en kan zelf een account maken.
            </p>
            {fout && (
              <p id="ouder-email-fout" className="flex items-start gap-2 tekst-klein font-semibold text-fout">
                <Icoon naam="fout" className="mt-0.5 size-5" />
                {fout}
              </p>
            )}
            <button type="submit" className="mt-2 min-h-12 rounded-[12px] bg-actie-blauw px-4 text-lg font-bold text-wit hover:bg-actie-hover">
              Stuur een mail naar mijn ouder
            </button>
          </form>
        )}
        <button type="button" onClick={sluit} className="mt-2 min-h-12 w-full rounded-[12px] bg-blauw-zacht px-4 text-lg font-bold text-inkt hover:bg-[#d9ecfd]">
          Ik oefen verder
        </button>
        <p className="mt-4 tekst-klein text-tekst-zacht">Je kunt ook zonder account blijven oefenen.</p>
      </div>
    </dialog>
  );
}
