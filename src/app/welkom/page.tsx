import type { Metadata } from "next";
import Link from "next/link";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Logo, Mees } from "@/components/mees/Mees";

export const metadata: Metadata = { title: "Welkom" };

/** Eerste scherm van de Mees-app (in plaats van de landingspagina). Eerste opzet; wordt later verder uitgewerkt. */
export default function WelkomPage() {
  return (
    <main
      id="inhoud"
      className="mees-content flex flex-1 flex-col items-center justify-center gap-6 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center"
    >
      <Logo className="w-40" />
      <Mees pose="zwaait" breedte={220} prioriteit className="w-48 tablet:w-56" />
      <div>
        <h1 className="titel-held">Hoi! Ik ben Mees.</h1>
        <p className="mt-2 tekst-intro text-tekst-zacht">Zullen we samen oefenen?</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <PrimaireKnop href="/kind/start" groot>
          Start met oefenen
          <Icoon naam="pijl-rechts" />
        </PrimaireKnop>
        <SecundaireKnop href="/ouder/inloggen" groot>
          <Icoon naam="slot" />
          Inloggen als ouder
        </SecundaireKnop>
      </div>
      <p className="tekst-klein text-tekst-zacht">
        Nog geen ouderaccount?{" "}
        <Link href="/ouder/account-aanmaken" className="font-semibold text-actie-blauw underline underline-offset-4">
          Maak er gratis een
        </Link>
      </p>
    </main>
  );
}
