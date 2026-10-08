import type { Metadata } from "next";
import { BreukKaartjes } from "@/components/mees/Breuk";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";

export const metadata: Metadata = { title: "Zo werkt Mees" };

const stappen = [
  { titel: "Kies wat je wilt oefenen", tekst: "Volg het voorstel van Mees of kies zelf een onderdeel, het niveau en het aantal vragen." },
  { titel: "Oefen met hints en uitleg", tekst: "Lukt het niet, dan volgt eerst een hint, dan nog een, en daarna rustige uitleg. Later komt een soortgelijke vraag terug." },
  { titel: "Kijk wat zelfstandig lukt", tekst: "Pas als iets op meerdere momenten zonder hulp lukt, staat het bij ‘Gaat zelfstandig’." },
];

export default function HoeMeesWerktPage() {
  return (
    <div className="mees-content flex flex-col gap-10 py-8 tablet:py-12">
      <div className="flex flex-col items-start justify-between gap-6 tablet:flex-row tablet:items-center">
        <div>
          <h1 className="titel-held">Zo werkt Mees</h1>
          <p className="mt-2 subtitel font-semibold text-tekst-zacht">Rustig oefenen. Hulp als dat nodig is.</p>
        </div>
        <div className="flex items-end gap-3" aria-hidden>
          <Mees pose="helpt" breedte={180} className="w-36" />
          <BreukKaartjes links={[1, 2]} rechts={[3, 4]} teken="<" klein />
        </div>
      </div>
      <ol className="grid gap-4 tablet:grid-cols-3">
        {stappen.map((s, i) => (
          <li key={s.titel} className="flex flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-6">
            <span className="grid size-12 place-items-center rounded-full bg-blauw-zacht text-xl font-extrabold text-actie-blauw" aria-hidden>
              {i + 1}
            </span>
            <h2 className="subtitel">{s.titel}</h2>
            <p className="text-tekst-zacht">{s.tekst}</p>
          </li>
        ))}
      </ol>
      <ul className="grid gap-3 tablet:grid-cols-2">
        <li className="flex items-start gap-3 rounded-[16px] bg-blauw-zacht p-5">
          <Icoon naam="werkblad" className="mt-0.5 size-6 text-actie-blauw" />
          <span>
            <span className="block font-bold">Ook op papier</span>
            <span className="block text-tekst-zacht">Maak een werkblad om te printen, met antwoordblad voor ouders.</span>
          </span>
        </li>
        <li className="flex items-start gap-3 rounded-[16px] bg-blauw-zacht p-5">
          <Icoon naam="check" className="mt-0.5 size-6 text-actie-blauw" />
          <span>
            <span className="block font-bold">Gratis dankzij donaties</span>
            <span className="block text-tekst-zacht">Geen advertenties, geen abonnement, geen punten of ranglijsten.</span>
          </span>
        </li>
      </ul>
      <div className="flex flex-col gap-3 min-[480px]:flex-row">
        <PrimaireKnop href="/kind/start" groot>
          Probeer het zelf
          <Icoon naam="pijl-rechts" />
        </PrimaireKnop>
        <SecundaireKnop href="/ouder/account-aanmaken" groot>
          Maak een gratis account
        </SecundaireKnop>
      </div>
    </div>
  );
}
