import type { Metadata } from "next";
import { InfoBlok, InfoPagina } from "@/features/donateurs/InfoPagina";

export const metadata: Metadata = { title: "Stichting en ANBI" };

export default function StichtingPage() {
  return (
    <InfoPagina titel="Onze plannen voor stichting en ANBI" intro="We willen Mees duurzaam en transparant organiseren, met onderwijs voor kinderen als doel.">
      <InfoBlok titel="Een stichting voor Mees">
        <p>We willen Mees onderbrengen in een stichting. De juridische naam, het bestuur, de registratie en het beleidsplan worden pas gepubliceerd wanneer deze formeel vaststaan.</p>
      </InfoBlok>
      <InfoBlok titel="ANBI-status aanvragen">
        <p>Een ANBI is een algemeen nut beogende instelling die door de Belastingdienst is aangewezen. We willen deze status aanvragen. Een aanvraag is geen toekenning en geeft geen garantie dat de status wordt verleend.</p>
        <p className="text-tekst-zacht">Na een officiële toekenning plaatsen we hier de juiste registratie- en publicatiegegevens.</p>
      </InfoBlok>
      <InfoBlok titel="Wat betekent dit voor je donatie?">
        <p>We presenteren donaties aan Mees nu niet als aftrekbare ANBI-giften. Na een eventuele toekenning kan een gift onder voorwaarden aftrekbaar zijn. De regels hangen af van de soort gift en de situatie van de gever.</p>
        <p>Voor mensen en bedrijven kunnen verschillende regels gelden. Controleer altijd de actuele voorwaarden bij de Belastingdienst.</p>
      </InfoBlok>
      <InfoBlok titel="Meerjarig steunen en een periodieke gift">
        <p>Meerjarige steun helpt Mees vooruit te plannen. Het is niet automatisch een fiscale periodieke gift. Ook een maandelijks opzegbare donatie is dat niet automatisch.</p>
        <p>Voor een fiscale periodieke gift gelden onder meer een vastgelegde overeenkomst, jaarlijks hetzelfde bedrag en een looptijd van ten minste vijf kalenderjaren. Zo&apos;n overeenkomst bieden we pas aan wanneer de status en voorwaarden hiervoor geregeld zijn.</p>
        <p className="tekst-klein text-tekst-zacht">Bron: Belastingdienst — periodieke en gewone giften. Gecontroleerd op 8 oktober 2026.</p>
      </InfoBlok>
      <InfoBlok titel="Volg de volgende stappen">
        <p>Hier publiceren we toekomstige updates over de oprichting, het beleid en de ANBI-aanvraag. We vermelden alleen afgeronde stappen als feit.</p>
      </InfoBlok>
    </InfoPagina>
  );
}
