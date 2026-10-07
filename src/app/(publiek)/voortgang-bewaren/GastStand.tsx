"use client";

import { useSyncExternalStore } from "react";
import { aantalAfgerond, gastLimietBereikt, oefenConfig, openSessie } from "@/features/oefenen/sessie";
import { haalOpslag } from "@/lib/opslag/lokaal";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";

const geenAbonnement = () => () => {};

/** Laat zien of er zonder account nog een nieuwe oefening kan, en of er een oefening te hervatten is. */
export function GastStand() {
  const stand = useSyncExternalStore(
    geenAbonnement,
    () => {
      const data = haalOpslag();
      return JSON.stringify({ limiet: gastLimietBereikt(data), afgerond: aantalAfgerond(data), open: openSessie(data)?.id ?? null });
    },
    () => null,
  );
  if (!stand) return null;
  const { limiet, open } = JSON.parse(stand) as { limiet: boolean; afgerond: number; open: string | null };
  return (
    <div className="flex w-full flex-col gap-3">
      {limiet ? (
        <p className="font-semibold">
          Zonder account kun je {oefenConfig.maxGastAfgerond} oefeningen maken. Met een gratis account kun je verder.
        </p>
      ) : (
        <SecundaireKnop href="/kind/start" groot className="w-full">
          Verder oefenen zonder account
        </SecundaireKnop>
      )}
      {limiet && open && (
        <PrimaireKnop href={`/kind/oefenen/${open}`} className="w-full">
          Maak je oefening af
        </PrimaireKnop>
      )}
    </div>
  );
}
