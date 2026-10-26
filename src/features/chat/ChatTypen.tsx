"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { meesTypt, meesWacht } from "./ritme";

// Mees "typt" zijn antwoord, zoals in een AI-chat: eerst even nadenken (drie puntjes), dan verschijnt de tekst van
// boven naar beneden. Alleen voor berichten die net zijn toegevoegd; na herladen staat alles er meteen.
// Keuzes, kaarten en een oefening die bij hetzelfde antwoord horen, verschijnen pas als het typen klaar is.

/** Berichten die nog moeten verschijnen (gevuld bij het toevoegen; leeg na herladen). */
const nieuw = new Set<string>();
/** Teksten van Mees die nog getypt moeten worden of getypt worden. */
const teksten = new Set<string>();
const luisteraars = new Set<() => void>();
const meld = () => luisteraars.forEach((l) => l());
const abonneer = (l: () => void) => {
  luisteraars.add(l);
  return () => luisteraars.delete(l);
};

/** Nieuwe berichten van Mees: teksten worden getypt, andere berichten wachten daarop. */
export function markeerNieuw(berichten: { id: string; tekst: string }[]) {
  for (const b of berichten) {
    nieuw.add(b.id);
    if (b.tekst) teksten.add(b.id);
  }
}

function klaarMet(id: string) {
  nieuw.delete(id);
  if (teksten.delete(id)) meld();
}

const rustig = () => document.documentElement.dataset.rustigeOvergangen === "true" || matchMedia("(prefers-reduced-motion: reduce)").matches;

// Rustig genoeg om te zien dat Mees antwoordt: eerst even nadenken, dan ongeveer 13 woorden per seconde.
const DENKEN_MS = 900;
const WOORDEN_PER_TIK = 1;
export const TIK_MS = 75;

/** Tekst van Mees die verschijnt alsof hij typt; `children` (keuzes, kaart, voorlezen) komen daarna. */
export function TypTekst({ id, tekst, className, children }: { id: string; tekst: string; className?: string; children?: ReactNode }) {
  const delen = useMemo(() => tekst.split(/(\s+)/), [tekst]);
  const [fase, setFase] = useState<"denkt" | "typt" | "klaar">(() => (nieuw.has(id) && !rustig() ? "denkt" : "klaar"));
  const [getoond, setGetoond] = useState(0);

  // Klaar met typen zodra alle woorden staan (afgeleid; geen extra state).
  const klaar = fase === "klaar" || (fase === "typt" && getoond >= delen.length);
  // Zolang Mees typt, wachten de opties in de chatbalk.
  useEffect(() => (klaar ? undefined : meesTypt()), [klaar]);

  useEffect(() => {
    if (klaar) return klaarMet(id);
    if (fase === "denkt") {
      const t = setTimeout(() => setFase("typt"), DENKEN_MS);
      return () => clearTimeout(t);
    }
    const iv = setInterval(() => setGetoond((n) => n + WOORDEN_PER_TIK * 2), TIK_MS);
    return () => clearInterval(iv);
  }, [fase, klaar, id]);

  if (fase === "denkt") return <Puntjes />;
  return (
    <>
      {!klaar ? (
        <p className={className}>
          <span className="sr-only">{tekst}</span>
          <span aria-hidden>
            {delen.slice(0, getoond).join("")}
            <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.2em] animate-pulse bg-actie-blauw" />
          </span>
        </p>
      ) : (
        tekst && <p className={className}>{tekst}</p>
      )}
      {klaar && <div className="mees-verschijn">{children}</div>}
    </>
  );
}

/** Mees denkt na. */
export function Puntjes() {
  return (
    <p className="mt-2 flex h-7 items-center gap-1.5" aria-label="Mees denkt na">
      {[0, 150, 300].map((d) => (
        <span key={d} className="size-2.5 animate-bounce rounded-full bg-[#9fcdfb]" style={{ animationDelay: `${d}ms` }} />
      ))}
    </p>
  );
}

/** Wacht met tonen tot Mees klaar is met typen (voor een oefening die bij hetzelfde antwoord hoort). */
export function NaTypen({ id, children }: { id: string; children: ReactNode }) {
  const wacht = useSyncExternalStore(
    abonneer,
    () => nieuw.has(id) && teksten.size > 0,
    () => false,
  );
  useEffect(() => {
    if (!wacht) {
      nieuw.delete(id);
      return;
    }
    // Veiligheid: nooit langer dan een paar seconden wachten.
    const t = setTimeout(() => {
      teksten.clear();
      meld();
    }, 10000);
    return () => clearTimeout(t);
  }, [wacht, id]);
  useEffect(() => (wacht ? meesWacht() : undefined), [wacht]);
  if (wacht) return null;
  return <>{children}</>;
}
