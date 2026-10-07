import type { Metadata } from "next";
import { Melding } from "@/components/mees/Bouwstenen";

export const metadata: Metadata = { title: "Privacy bij Mees" };

// I01: tijdelijke uitleg. De definitieve privacyverklaring volgt vóór Mees echt in gebruik gaat.
export default function PrivacyPage() {
  return (
    <article className="mees-content flex flex-col gap-6 py-8 tablet:max-w-3xl tablet:py-12">
      <div>
        <h1 className="titel-held">Privacy bij Mees</h1>
        <p className="mt-2 tekst-intro text-tekst-zacht">We gebruiken alleen gegevens die nodig zijn.</p>
      </div>
      <Melding soort="probeer-opnieuw">De definitieve privacyverklaring wordt vastgesteld vóór Mees officieel in gebruik gaat. Hieronder staat hoe Mees nu werkt.</Melding>
      <section className="flex flex-col gap-3">
        <h2 className="subtitel">Wat we bewaren</h2>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-lg">
          <li>Van een ouder: het e-mailadres, om in te loggen.</li>
          <li>Van een kind: alleen een voornaam, de groep en een gekozen dier. Geen achternaam, geboortedatum of foto.</li>
          <li>Oefeningen, antwoorden, gebruikte hints en ontdekte weetjes, zodat Mees passende oefeningen kan voorstellen.</li>
          <li>Zonder account blijft alles alleen in de browser van het apparaat.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="subtitel">Wat we niet doen</h2>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-lg">
          <li>Geen advertenties en geen tracking.</li>
          <li>Donateurs krijgen geen gegevens en hebben geen invloed op de lesinhoud.</li>
          <li>Kinderen zien elkaar niet en kunnen elkaar geen berichten sturen.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="subtitel">Jouw keuzes</h2>
        <p className="text-lg">
          Als ouder kun je in het ouderoverzicht onder Privacy al je gegevens downloaden, een kinderprofiel verwijderen of je hele account verwijderen.
        </p>
      </section>
    </article>
  );
}
