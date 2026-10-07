import type { Metadata } from "next";
import Link from "next/link";
import { Icoon } from "@/components/mees/Icoon";
import { Mees } from "@/components/mees/Mees";
import { RegistratieFormulier } from "./RegistratieFormulier";

export const metadata: Metadata = { title: "Maak een gratis ouderaccount" };

const voordelen = [
  { icoon: "voortgang" as const, titel: "Voortgang bewaren", tekst: "Op elk apparaat verder waar je kind was." },
  { icoon: "persoon" as const, titel: "Profiel per kind", tekst: "Alleen een voornaam en een gekozen dier." },
  { icoon: "scherm" as const, titel: "Leren op eigen tempo", tekst: "Thuis, op de computer, tablet of telefoon." },
];

export default function AccountAanmakenPage() {
  return (
    <div className="mees-content grid gap-10 py-8 tablet:py-12 desktop:grid-cols-[1fr_0.9fr] desktop:gap-16 desktop:py-16">
      <div className="max-w-xl">
        <h1 className="titel-held">Maak een gratis ouderaccount</h1>
        <p className="mt-2 tekst-intro text-tekst-zacht">Bewaar de voortgang van je kind. Mees blijft voor altijd gratis.</p>
        <RegistratieFormulier />
        <p className="mt-6 border-t border-rand-zacht pt-6">
          Heb je al een account?{" "}
          <Link href="/ouder/inloggen" className="font-bold text-actie-blauw underline underline-offset-4">
            Inloggen
          </Link>
        </p>
      </div>
      <aside className="flex flex-col gap-6 desktop:pt-16" aria-label="Wat je krijgt">
        <Mees pose="helpt" breedte={300} className="hidden w-72 self-center desktop:block" />
        <ul className="grid gap-4 tablet:grid-cols-3 desktop:grid-cols-1">
          {voordelen.map((v) => (
            <li key={v.titel} className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
                <Icoon naam={v.icoon} className="size-7" />
              </span>
              <span>
                <span className="block text-lg font-bold">{v.titel}</span>
                <span className="block text-tekst-zacht">{v.tekst}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="rounded-[16px] bg-blauw-zacht p-4 tekst-klein">Je kind heeft geen eigen e-mailadres of wachtwoord nodig.</p>
      </aside>
    </div>
  );
}
