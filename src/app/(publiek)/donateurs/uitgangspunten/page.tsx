import type { Metadata } from "next";
import { Cta, PaginaHero, Split, Tegels, Uitklap } from "@/features/donateurs/InfoPagina";

export const metadata: Metadata = { title: "Onze uitgangspunten" };

export default function UitgangspuntenPage() {
  return (
    <div className="mees-content flex flex-col gap-10 py-8 tablet:max-w-[1000px] tablet:py-12">
      <PaginaHero kruimel="Onze uitgangspunten" titel="Leren met vertrouwen." intro="Gratis oefenen, onafhankelijke leerinhoud en zorgvuldige hulp. Dat is waar Mees voor staat." beeld="mees-doneert" />
      <Tegels
        items={[
          { icoon: "icoon-leerinhoud", titel: "Altijd gratis", tekst: "Mees is bedoeld voor ieder kind. Ouders hoeven geen financiële hulp aan te vragen." },
          { icoon: "icoon-cap", titel: "Onafhankelijk onderwijs", tekst: "Donateurs krijgen geen invloed op opdrachten of leeradviezen." },
          { icoon: "icoon-veiligheid", titel: "Kindgegevens blijven privé", tekst: "We verkopen geen kindgegevens en geven ze niet aan donateurs." },
          { icoon: "icoon-tutoren", titel: "Leren zonder druk", tekst: "Geen streaks, ranglijsten of punten. Kinderen mogen stoppen en later verdergaan." },
        ]}
      />
      <Split foto="kind-oefent-thuis" alt="Een kind oefent thuis aan tafel." titel="Hulp met aandacht.">
        <p>Tutorhulp vindt binnen Mees plaats, met toestemming en instellingen van de ouder.</p>
        <p className="text-tekst-zacht">Tutoren zien alleen wat nodig is om te helpen. Bij live-lessen zien kinderen elkaar niet en gaan vragen alleen naar de tutor.</p>
      </Split>
      <div className="flex flex-col gap-3">
        <Uitklap vraag="Welke gegevens zijn nodig?">
          <p>Kindprofielen gebruiken een voornaam en avatar. Voor voortgang en ouderfuncties verwerken we ook oefenresultaten en oudercontactgegevens. Een voornaam maakt deze gegevens niet anoniem.</p>
          <p className="text-tekst-zacht">Dit is een samenvatting van onze uitgangspunten. Het volledige privacybeleid, inclusief doeleinden, bewaartermijnen en betrokken partijen, moet vóór ingebruikname gereed zijn.</p>
        </Uitklap>
        <Uitklap vraag="Wat krijgen donateurs terug?">
          <p>Met toestemming tonen we hun naam en logo op de donateurspagina. Zij krijgen geen gegevens van kinderen, invloed op de leerinhoud of reclameplek in de oefeningen.</p>
        </Uitklap>
      </div>
      <Cta titel="Samen houden we leren toegankelijk." tekst="Meerjarige steun geeft ruimte om vooruit te plannen." knop="Steun meerdere jaren" href="/donateurs#aanmelden" />
    </div>
  );
}
