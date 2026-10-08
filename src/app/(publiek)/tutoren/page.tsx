import type { Metadata } from "next";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { tutorAfspraken } from "@/features/tutorhulp/afspraken";

export const metadata: Metadata = {
  title: "Word tutor bij Mees",
  description: "Help kinderen van groep 5 tot en met 8 met een korte uitleg met stem en tekenbord, in je eigen tijd.",
};

const stappen = [
  { titel: "Meld je aan", tekst: "Maak een account en vertel kort over je ervaring en waarom je wilt helpen." },
  { titel: "Mees bekijkt je aanmelding", tekst: "Pas na goedkeuring zie je hulpvragen. Mees kan om een VOG vragen." },
  { titel: "Pak een hulpvraag op", tekst: "Je ziet wat een kind al heeft geprobeerd en maakt een korte uitleg met je stem en een tekenbord." },
];

const punten: { icoon: AlleIcoonNamen; titel: string; tekst: string }[] = [
  { icoon: "tijd", titel: "In je eigen tijd", tekst: "Er is geen rooster. Je kiest zelf wanneer je een hulpvraag oppakt." },
  { icoon: "tutor", titel: "Alleen wanneer het helpt", tekst: "Een hulpvraag komt pas bij jou als een kind hints, uitleg en een soortgelijke vraag al heeft geprobeerd, en een ouder het goed vindt." },
  { icoon: "slot", titel: "Veilig voor kinderen", tekst: "Je ziet alleen voornaam, groep en oefeningen. Geen contactgegevens, geen camera of microfoon van kinderen." },
  { icoon: "check", titel: "Je ziet wat het oplevert", tekst: "Na je uitleg maakt het kind een nieuwe controlevraag. Jij ziet of het zelfstandig lukt." },
];

export default function TutorenPage() {
  return (
    <div className="mees-content flex flex-col gap-10 py-8 tablet:py-12">
      <div className="flex flex-col items-start justify-between gap-6 tablet:flex-row tablet:items-center">
        <div className="max-w-2xl">
          <h1 className="titel-held">Word tutor bij Mees</h1>
          <p className="mt-2 subtitel font-semibold text-tekst-zacht">Help een kind verder met een korte, persoonlijke uitleg.</p>
          <p className="mt-4 tekst-intro">
            Mees is gratis voor kinderen van groep 5 tot en met 8. Soms lukt iets niet, ook niet na de hints en de uitleg. Dan kan een tutor helpen: met je stem en een tekenbord leg je het op een andere manier uit.
          </p>
          <div className="mt-6 flex flex-col gap-3 min-[480px]:flex-row">
            <PrimaireKnop href="/tutor/aanmelden" groot>
              Meld je aan als tutor
              <Icoon naam="pijl-rechts" />
            </PrimaireKnop>
            <SecundaireKnop href="/tutor/inloggen" groot>
              Inloggen
            </SecundaireKnop>
          </div>
        </div>
        <Mees pose="helpt" breedte={220} className="w-40 self-center tablet:w-52" />
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
        {punten.map((p) => (
          <li key={p.titel} className="flex items-start gap-3 rounded-[16px] bg-blauw-zacht p-5">
            <Icoon naam={p.icoon} className="mt-0.5 size-6 text-actie-blauw" />
            <span>
              <span className="block font-bold">{p.titel}</span>
              <span className="block text-tekst-zacht">{p.tekst}</span>
            </span>
          </li>
        ))}
      </ul>

      <section aria-labelledby="afspraken" className="rounded-[16px] border border-rand-zacht bg-wit p-6">
        <h2 id="afspraken" className="subtitel">
          De afspraken
        </h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
          {tutorAfspraken.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="mt-4 tekst-klein text-tekst-zacht">Live-lessen voor kleine groepen komen later. Ook daar zien kinderen elkaar niet en gaan vragen alleen naar de tutor.</p>
      </section>
    </div>
  );
}
