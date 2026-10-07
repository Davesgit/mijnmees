import type { Metadata } from "next";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";

export const metadata: Metadata = { title: "Even bewegen" };

const ideeen = ["Loop een rondje door de kamer.", "Strek je armen hoog in de lucht.", "Spring vijf keer zachtjes op en neer.", "Drink een slokje water."];

export default function PauzePage() {
  return (
    <div className="mees-content flex flex-col items-center gap-6 py-10 text-center tablet:max-w-2xl tablet:py-14">
      <Mees pose="zwaait" breedte={180} prioriteit className="w-36 tablet:w-44" />
      <div>
        <h1 className="titel-held">Even bewegen</h1>
        <p className="mt-2 tekst-intro text-tekst-zacht">Even bewegen of stoppen is ook een goede keuze.</p>
      </div>
      <ul className="grid w-full gap-3 text-left">
        {ideeen.map((idee) => (
          <li key={idee} className="rounded-[16px] bg-blauw-zacht px-5 py-4 text-lg">
            {idee}
          </li>
        ))}
      </ul>
      <p className="text-tekst-zacht">Je kunt straks weer verder.</p>
      <div className="flex w-full flex-col gap-3 tablet:w-auto tablet:flex-row">
        <PrimaireKnop href="/kind/start" groot>
          Verder oefenen
        </PrimaireKnop>
        <SecundaireKnop href="/kind/start" groot>
          Klaar voor nu
        </SecundaireKnop>
      </div>
    </div>
  );
}
