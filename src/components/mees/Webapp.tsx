"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Icoon } from "./Icoon";

/** Registreert de service worker (alleen offlinepagina) in productie. */
export function WebappRegistratie() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const geenAbonnement = () => () => {};
const WEG = "mees:installtip:weg";

function platform(): "app" | "ios" | "anders" {
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "app";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "anders";
}

function weggeklikt() {
  try {
    return localStorage.getItem(WEG) === "1";
  } catch {
    return false;
  }
}

/** "Zet Mees op je beginscherm": installeerknop (Android/Chrome) of uitleg (iPhone/iPad). Niet als Mees al als app draait. */
export function InstallTip({ className = "" }: { className?: string }) {
  const soort = useSyncExternalStore(geenAbonnement, platform, () => "app" as const);
  const weg = useSyncExternalStore(geenAbonnement, weggeklikt, () => true);
  const [verborgen, setVerborgen] = useState(false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const vang = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const klaar = () => setVerborgen(true);
    window.addEventListener("beforeinstallprompt", vang);
    window.addEventListener("appinstalled", klaar);
    return () => {
      window.removeEventListener("beforeinstallprompt", vang);
      window.removeEventListener("appinstalled", klaar);
    };
  }, []);

  function sluit() {
    try {
      localStorage.setItem(WEG, "1");
    } catch {}
    setVerborgen(true);
  }

  async function installeer() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setVerborgen(true);
    setPrompt(null);
  }

  if (soort === "app" || weg || verborgen || (soort === "anders" && !prompt)) return null;
  return (
    <aside aria-label="Mees als app" className={`flex items-start gap-4 rounded-[16px] border border-rand-zacht bg-wit p-4 tablet:p-5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/app/icoon-192.png" alt="" width={56} height={56} className="size-14 shrink-0 rounded-[14px]" />
      <div className="min-w-0 flex-1">
        <p className="font-bold">Zet Mees op je beginscherm</p>
        {soort === "ios" ? (
          <p className="mt-1 text-tekst-zacht">
            Tik in Safari onderaan op <Icoon naam="delen" className="inline size-5 align-text-bottom text-actie-blauw" /> <strong>Deel</strong> en kies daarna <strong>Zet op beginscherm</strong>. Mees opent dan als app.
          </p>
        ) : (
          <>
            <p className="mt-1 text-tekst-zacht">Dan opent Mees als app, met een eigen icoon en zonder adresbalk.</p>
            <button type="button" onClick={installeer} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-full bg-actie-blauw px-5 font-bold text-wit hover:bg-actie-hover">
              Installeer Mees
            </button>
          </>
        )}
      </div>
      <button type="button" onClick={sluit} aria-label="Tip sluiten" className="-m-2 grid size-12 shrink-0 place-items-center rounded-full hover:bg-blauw-zacht">
        <Icoon naam="sluiten" />
      </button>
    </aside>
  );
}
