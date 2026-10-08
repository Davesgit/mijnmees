"use client";

import { useEffect, useState } from "react";
import { leesLokaleWerkbladen, type Werkblad } from "./werkblad";

export type WerkbladStaat =
  | { status: "laden" }
  | { status: "niet-gevonden" }
  | { status: "klaar"; werkblad: Werkblad; opServer: boolean };

async function laad(id: string): Promise<WerkbladStaat> {
  // Eerst het account (dan kan er een antwoordblad bij), anders dit apparaat.
  const antwoord = await fetch(`/api/werkbladen/${encodeURIComponent(id)}`, { cache: "no-store" }).catch(() => null);
  if (antwoord?.ok) {
    const { werkblad } = (await antwoord.json()) as { werkblad: Werkblad };
    return { status: "klaar", werkblad, opServer: true };
  }
  const lokaal = leesLokaleWerkbladen().find((w) => w.id === id);
  return lokaal ? { status: "klaar", werkblad: lokaal, opServer: false } : { status: "niet-gevonden" };
}

export function useWerkblad(id: string): WerkbladStaat {
  const [staat, setStaat] = useState<{ id: string; staat: WerkbladStaat } | null>(null);
  useEffect(() => {
    let actief = true;
    laad(id).then((s) => actief && setStaat({ id, staat: s }));
    return () => {
      actief = false;
    };
  }, [id]);
  return staat?.id === id ? staat.staat : { status: "laden" };
}

/** Querystring voor "Pas aan": dezelfde instellingen terug in W01. */
export function aanpasLink(w: Werkblad) {
  const i = w.instellingen;
  const q = new URLSearchParams({
    onderwerpen: i.onderwerpen.join(","),
    niveau: i.niveau,
    aantal: String(i.aantal),
    seed: String(i.seed),
    bewerkingen: i.bewerkingen.join(","),
  });
  if (i.tafels.length) q.set("tafels", i.tafels.join(","));
  return `/werkbladen/samenstellen?${q}`;
}
