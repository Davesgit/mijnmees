import type { Metadata } from "next";
import Link from "next/link";
import { InfoBlok, InfoPagina } from "@/features/donateurs/InfoPagina";

export const metadata: Metadata = { title: "Waar gaat je gift naartoe?" };

export default function BestedingPage() {
  return (
    <InfoPagina titel="Waar gaat je gift naartoe?" intro="Je bijdrage helpt om Mees gratis toegankelijk te houden en verder te ontwikkelen.">
      <InfoBlok titel="Een platform dat blijft werken">
        <p>Hosting, onderhoud, beveiliging en een prettige werking op computer, tablet en telefoon vormen de basis.</p>
      </InfoBlok>
      <InfoBlok titel="Lesinhoud en passende hulp">
        <p>We investeren in goede opdrachten, gelaagde hints, begrijpelijke uitleg en werkbladen. Tutorhulp vraagt tijd en zorgvuldige organisatie. De beschikbaarheid bouwen we op binnen de mogelijkheden van Mees.</p>
      </InfoBlok>
      <InfoBlok titel="Een reserve voor later">
        <p>We willen een buffer opbouwen zodat kinderen ook in de komende jaren kunnen blijven oefenen. Meerjarige donatieafspraken helpen om inkomsten en uitgaven vooruit te plannen.</p>
        <p className="text-tekst-zacht">We noemen pas een concrete periode die met de reserve gedekt is wanneer die financieel onderbouwd kan worden.</p>
      </InfoBlok>
      <InfoBlok titel="Inzicht in de besteding">
        <p>We willen jaarlijks inzicht geven in inkomsten, uitgaven en de reserve. Begrotingen en jaarverslagen worden hier gepubliceerd zodra ze beschikbaar zijn. Er zijn nu nog geen gepubliceerde bestedingscijfers.</p>
        <p>
          <Link href="/donateurs/transparantie" className="font-semibold text-actie-blauw underline underline-offset-4">
            Bekijk de voorlopige begroting: wat kost Mees?
          </Link>
        </p>
        <p className="text-tekst-zacht">We beloven geen vast aantal kinderen of oefenuren per donatie zolang dat niet verantwoord berekend kan worden.</p>
      </InfoBlok>
    </InfoPagina>
  );
}
