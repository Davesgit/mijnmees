import type { Metadata } from "next";
import { Mees } from "@/components/mees/Mees";
import { OpnieuwKnop } from "./OpnieuwKnop";

export const metadata: Metadata = { title: "Geen verbinding", robots: { index: false } };

/** Getoond door de service worker als er geen internet is. Statisch, zonder gegevens. */
export default function OfflinePage() {
  return (
    <main id="inhoud" className="mees-content flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
      <Mees pose="helpt" breedte={160} className="w-32" />
      <h1 className="titel-held">Je bent even niet verbonden</h1>
      <p className="max-w-md tekst-intro text-tekst-zacht">Mees heeft internet nodig. Controleer je wifi of mobiele data en probeer het opnieuw.</p>
      <OpnieuwKnop />
    </main>
  );
}
