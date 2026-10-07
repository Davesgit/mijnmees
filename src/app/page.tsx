import Link from "next/link";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { Logo, Mees } from "@/components/mees/Mees";

// Tijdelijke publieke startpagina. De volledige ouderpagina (A00) volgt met de ouderaccounts in fase 3.
export default function Home() {
  return (
    <>
      <header className="border-b border-rand-zacht">
        <div className="mees-content flex h-16 items-center tablet:h-20">
          <Link href="/" className="-ml-1 rounded-[12px] p-1" aria-label="Mees">
            <Logo />
          </Link>
        </div>
      </header>
      <main id="inhoud" className="mees-content flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center tablet:max-w-3xl">
        <Mees pose="zwaait" breedte={220} prioriteit className="w-40 tablet:w-52" />
        <div>
          <h1 className="titel-held">Leren op jouw niveau</h1>
          <p className="mt-4 tekst-intro text-tekst-zacht">
            Mees is een gratis plek waar kinderen van groep 5 tot en met 8 zelfstandig oefenen. Met rustige hints, uitleg en
            zonder punten of ranglijsten. Mees blijft altijd gratis.
          </p>
        </div>
        <PrimaireKnop href="/kind/start" groot>
          Begin met oefenen
        </PrimaireKnop>
        <p className="max-w-xl tekst-klein text-tekst-zacht">
          Je kunt meteen beginnen, zonder account. De voortgang blijft dan alleen in deze browser. Ouderaccounts komen binnenkort.
        </p>
      </main>
    </>
  );
}
