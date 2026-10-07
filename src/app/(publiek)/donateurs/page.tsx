import type { Metadata } from "next";
import { Mees } from "@/components/mees/Mees";

export const metadata: Metadata = { title: "Onze donateurs" };

// A07: alleen beheerde namen/logo's. Er zijn nog geen donateurs; geen voorbeeldbedrijven tonen.
export default function DonateursPage() {
  return (
    <div className="mees-content flex flex-col items-center gap-6 py-10 text-center tablet:max-w-2xl tablet:py-16">
      <Mees pose="blij" breedte={160} prioriteit className="w-32" />
      <h1 className="titel-held">Onze donateurs</h1>
      <p className="tekst-intro text-tekst-zacht">
        Mees is voor altijd gratis. Dat kan dankzij organisaties en mensen die goed onderwijs belangrijk vinden.
      </p>
      <p className="rounded-[16px] bg-blauw-zacht p-6 text-lg">Hier komen binnenkort de namen van onze eerste donateurs.</p>
      <p className="text-tekst-zacht">Donateurs krijgen geen gegevens van kinderen of ouders en hebben geen invloed op wat Mees leert.</p>
    </div>
  );
}
