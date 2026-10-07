"use client";

import { useSyncExternalStore } from "react";
import type { OpslagData } from "@/features/oefenen/types";
import { abonneerOpslag, actiefProfiel, haalOpslag, wijzigOpslag } from "./lokaal";
import type { SyncAntwoord, SyncVerzoek } from "./schema";

// Stuurt de voortgang van het actieve kinderprofiel naar de server.
// Werkt als een outbox: alles blijft lokaal staan tot de server het heeft bevestigd (per event-id, idempotent).

type SyncStand = { pogingen: string[]; sessies: Record<string, number>; weetjes: string[]; reviews: string };
export type SyncStatus = "bewaard" | "bezig" | "wacht" | "mislukt";

const standSleutel = (kindId: string) => `mees:sync:${kindId}:v1`;

function leesStand(kindId: string): SyncStand {
  try {
    const ruw = localStorage.getItem(standSleutel(kindId));
    if (ruw) return JSON.parse(ruw) as SyncStand;
  } catch {}
  return { pogingen: [], sessies: {}, weetjes: [], reviews: "" };
}

function schrijfStand(kindId: string, stand: SyncStand) {
  try {
    localStorage.setItem(standSleutel(kindId), JSON.stringify(stand));
  } catch {}
}

let status: SyncStatus = "bewaard";
const statusLuisteraars = new Set<() => void>();
function zetStatus(nieuw: SyncStatus) {
  if (nieuw === status) return;
  status = nieuw;
  statusLuisteraars.forEach((l) => l());
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      statusLuisteraars.add(l);
      return () => statusLuisteraars.delete(l);
    },
    () => status,
    () => "bewaard" as SyncStatus,
  );
}

function reviewsSleutel(data: OpslagData) {
  return JSON.stringify(data.reviews.map((r) => r.leerdoelId).sort());
}

function openstaand(data: OpslagData, stand: SyncStand): SyncVerzoek | null {
  const verstuurd = new Set(stand.pogingen);
  const pogingen = data.pogingen.filter((p) => !verstuurd.has(p.eventId)).slice(0, 500);
  const nodigeSessies = new Set(pogingen.map((p) => p.sessieId));
  const ontdekt = new Set(stand.weetjes);
  const weetjes = data.weetjes.filter((w) => !ontdekt.has(w.weetjeId));
  weetjes.forEach((w) => nodigeSessies.add(w.sessieId));
  const sessies = Object.values(data.sessies)
    .filter((s) => (stand.sessies[s.id] ?? 0) < s.versie || nodigeSessies.has(s.id))
    .slice(0, 50);
  const reviewsGewijzigd = reviewsSleutel(data) !== stand.reviews;
  if (!pogingen.length && !sessies.length && !weetjes.length && !reviewsGewijzigd) return null;
  return { sessies, pogingen, weetjes, reviews: data.reviews };
}

let timer: ReturnType<typeof setTimeout> | null = null;
let bezig = false;
let wachttijd = 2000;

async function verstuur(kindId: string) {
  if (bezig || actiefProfiel() !== kindId) return;
  const data = haalOpslag();
  const stand = leesStand(kindId);
  const verzoek = openstaand(data, stand);
  if (!verzoek) {
    zetStatus("bewaard");
    return;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    zetStatus("wacht");
    return;
  }
  bezig = true;
  zetStatus("bezig");
  try {
    const res = await fetch("/api/voortgang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verzoek),
    });
    const body = (await res.json().catch(() => ({ status: "retryable" }))) as SyncAntwoord;
    if (res.ok && body.status === "accepted") {
      const nieuw: SyncStand = {
        pogingen: [...new Set([...stand.pogingen, ...(body.pogingen ?? [])])],
        sessies: { ...stand.sessies, ...(body.sessies ?? {}) },
        weetjes: [...new Set([...stand.weetjes, ...(body.weetjes ?? [])])],
        reviews: reviewsSleutel(data),
      };
      // Pogingen die de server weigerde (bijv. onbekende vraag) niet eindeloos opnieuw sturen.
      for (const p of verzoek.pogingen) if (!nieuw.pogingen.includes(p.eventId)) nieuw.pogingen.push(p.eventId);
      for (const w of verzoek.weetjes) if (!nieuw.weetjes.includes(w.weetjeId)) nieuw.weetjes.push(w.weetjeId);
      schrijfStand(kindId, nieuw);
      wachttijd = 2000;
      bezig = false;
      // Mogelijk is er tijdens het versturen nieuwe voortgang bijgekomen.
      return verstuur(kindId);
    }
    zetStatus(res.status === 401 || res.status === 403 ? "mislukt" : "wacht");
    if (res.status >= 500 || res.status === 0) plan(kindId, true);
  } catch {
    zetStatus("wacht");
    plan(kindId, true);
  }
  bezig = false;
}

function plan(kindId: string, opnieuw = false) {
  if (timer) clearTimeout(timer);
  const wacht = opnieuw ? wachttijd : 800;
  if (opnieuw) wachttijd = Math.min(wachttijd * 2, 60_000);
  timer = setTimeout(() => void verstuur(kindId), wacht);
}

/** Start synchronisatie voor dit kinderprofiel; geeft een opruimfunctie terug. */
export function startSync(kindId: string) {
  const stop = abonneerOpslag(() => plan(kindId));
  const online = () => plan(kindId);
  window.addEventListener("online", online);
  plan(kindId);
  return () => {
    stop();
    window.removeEventListener("online", online);
    if (timer) clearTimeout(timer);
  };
}

/** Haalt de voortgang van de server op en voegt die samen met wat dit apparaat al heeft. */
export async function haalVanServer(kindId: string) {
  try {
    const res = await fetch("/api/voortgang", { cache: "no-store" });
    if (!res.ok) return false;
    const body = (await res.json()) as { status: string; data?: Pick<OpslagData, "sessies" | "pogingen" | "weetjes" | "reviews"> };
    if (body.status !== "accepted" || !body.data || actiefProfiel() !== kindId) return false;
    const server = body.data;

    const stand = leesStand(kindId);
    wijzigOpslag((lokaal) => {
      const sessies = { ...lokaal.sessies };
      for (const s of Object.values(server.sessies)) {
        if ((sessies[s.id]?.versie ?? 0) <= s.versie) sessies[s.id] = s;
        stand.sessies[s.id] = Math.max(stand.sessies[s.id] ?? 0, s.versie);
      }
      const bekendePogingen = new Set(lokaal.pogingen.map((p) => p.eventId));
      const pogingen = [...lokaal.pogingen, ...server.pogingen.filter((p) => !bekendePogingen.has(p.eventId))].sort((a, b) =>
        a.op.localeCompare(b.op),
      );
      const bekendeWeetjes = new Set(lokaal.weetjes.map((w) => w.weetjeId));
      const weetjes = [...lokaal.weetjes, ...server.weetjes.filter((w) => !bekendeWeetjes.has(w.weetjeId))];
      const reviewDoelen = new Set(lokaal.reviews.map((r) => r.leerdoelId));
      const reviews = [...lokaal.reviews, ...server.reviews.filter((r) => !reviewDoelen.has(r.leerdoelId))];
      stand.pogingen = [...new Set([...stand.pogingen, ...server.pogingen.map((p) => p.eventId)])];
      stand.weetjes = [...new Set([...stand.weetjes, ...server.weetjes.map((w) => w.weetjeId)])];
      return { ...lokaal, sessies, pogingen, weetjes, reviews };
    });
    schrijfStand(kindId, stand);
    return true;
  } catch {
    return false;
  }
}

/** Direct versturen (bijv. na het meenemen van gastvoortgang); wacht tot de server heeft geantwoord. */
export async function synchroniseerNu(kindId: string) {
  await verstuur(kindId);
  return status === "bewaard";
}
