import type { Metadata } from "next";
import { Cta, PaginaHero, Split, Uitklap } from "@/features/donateurs/InfoPagina";

export const metadata: Metadata = { title: "Stichting en ANBI" };

const stappen = [
  { titel: "Stichting oprichten", tekst: "Juridische structuur, onafhankelijk bestuur en duidelijke verantwoordelijkheden." },
  { titel: "Beleid vastleggen", tekst: "Een beleidsplan, begroting en afspraken over kwaliteit en continuïteit." },
  { titel: "ANBI-status aanvragen", tekst: "Een aanvraag na voorbereiding. Toekenning is niet gegarandeerd." },
];

export default function StichtingPage() {
  return (
    <div className="mees-content flex flex-col gap-10 py-8 tablet:max-w-[1000px] tablet:py-12">
      <PaginaHero kruimel="Stichting en ANBI" badge="Stichting en ANBI: toekomstplannen" titel="Een stevige basis voor Mees." intro="We willen gratis leren duurzaam organiseren, met openheid over beleid en geld." beeld="mees-bouwt-aan-later" />
      <section className="rounded-[20px] bg-blauw-zacht p-5 tablet:p-8">
        <h2 className="titel-pagina">Waar staan we nu?</h2>
        <p className="mt-2 text-lg">Mees wordt opgebouwd door de oprichter. De stichting en ANBI-status zijn nog toekomstplannen. Mees heeft nu geen ANBI-status.</p>
      </section>
      <ol className="grid gap-4 tablet:grid-cols-3">
        {stappen.map((s, i) => (
          <li key={s.titel} className="flex flex-col gap-3 rounded-[20px] border border-rand-zacht bg-wit p-5">
            <span className="grid size-12 place-items-center rounded-full bg-blauw-zacht text-xl font-extrabold text-actie-blauw" aria-hidden>
              {i + 1}
            </span>
            <h2 className="subtitel">{s.titel}</h2>
            <p className="text-tekst-zacht">{s.tekst}</p>
          </li>
        ))}
      </ol>
      <Split foto="ouder-kind-werkblad" alt="Een ouder helpt een kind met een werkblad." titel="Het doel blijft hetzelfde.">
        <p>Kinderen in Nederland helpen leren, ongeacht wat hun ouders kunnen betalen.</p>
        <p className="text-tekst-zacht">Wanneer formele gegevens vaststaan, publiceren we hier het bestuur, het beleid en de registratiegegevens.</p>
      </Split>
      <div className="flex flex-col gap-3">
        <Uitklap vraag="Is mijn donatie fiscaal aftrekbaar?">
          <p>We presenteren donaties nu niet als aftrekbare ANBI-giften. Bij een toekomstige officiële toekenning informeren we over de dan geldende voorwaarden. Vraag bij twijfel advies en controleer de actuele informatie bij de Belastingdienst.</p>
        </Uitklap>
        <Uitklap vraag="Is meerjarige steun een periodieke gift?">
          <p>Meerjarige steun helpt Mees plannen, maar is niet automatisch een fiscale periodieke gift. Een dergelijke overeenkomst bieden we pas aan wanneer de status en voorwaarden zijn geregeld.</p>
        </Uitklap>
      </div>
      <Cta titel="Help bouwen aan de toekomst." tekst="Bespreek een meerjarige bijdrage met ons." knop="Steun meerdere jaren" href="/donateurs#aanmelden" />
    </div>
  );
}
