"use client";

import { useEffect } from "react";

type WakeLock = { release: () => Promise<void>; released: boolean };

/**
 * Houdt het scherm aan zolang `actief` waar is (live-les, uitleg afspelen), zodat de telefoon niet op slot gaat.
 * Werkt waar de browser het ondersteunt; anders gebeurt er niets.
 */
export function useSchermAan(actief: boolean) {
  useEffect(() => {
    if (!actief) return;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLock> } };
    if (!nav.wakeLock) return;
    let slot: WakeLock | null = null;
    let weg = false;
    const vraag = async () => {
      try {
        if (!document.hidden && (!slot || slot.released)) slot = await nav.wakeLock!.request("screen");
        if (weg) await slot?.release();
      } catch {
        // Geweigerd (bijv. batterijbesparing): niet erg.
      }
    };
    // De browser laat het slot los als de pagina even op de achtergrond was: dan opnieuw vragen.
    const zichtbaar = () => void vraag();
    void vraag();
    document.addEventListener("visibilitychange", zichtbaar);
    return () => {
      weg = true;
      document.removeEventListener("visibilitychange", zichtbaar);
      void slot?.release().catch(() => {});
    };
  }, [actief]);
}
