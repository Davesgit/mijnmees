"use client";

import { createContext, use, useEffect, type ReactNode } from "react";
import type { Kind } from "@/lib/kinderen";
import { kiesProfiel } from "@/lib/opslag/lokaal";
import { haalVanServer, startSync } from "@/lib/opslag/sync";

export type ProfielContext = { kind: Kind | null; ouderIngelogd: boolean };

const Context = createContext<ProfielContext>({ kind: null, ouderIngelogd: false });

export function useProfiel() {
  return use(Context);
}

/** Bepaalt welk profiel deze browser gebruikt en houdt de voortgang van een kind gesynchroniseerd. */
export function ProfielProvider({ kind, ouderIngelogd, children }: ProfielContext & { children: ReactNode }) {
  // Vóór het renderen van de kinderen: de juiste lokale opslag kiezen (idempotent).
  kiesProfiel(kind?.id ?? null);

  const kindId = kind?.id;
  useEffect(() => {
    if (!kindId) return;
    let stop: (() => void) | undefined;
    let actief = true;
    void haalVanServer(kindId).finally(() => {
      if (actief) stop = startSync(kindId);
    });
    return () => {
      actief = false;
      stop?.();
    };
  }, [kindId]);

  return <Context value={{ kind, ouderIngelogd }}>{children}</Context>;
}

export function Avatar({ id, className = "size-10" }: { id: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/assets/avatars/${id}.svg`} alt="" className={`shrink-0 rounded-full ${className}`} />
  );
}
