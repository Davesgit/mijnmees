import type { Metadata } from "next";
import { InfoBlok, InfoPagina } from "@/features/donateurs/InfoPagina";

export const metadata: Metadata = { title: "Onze uitgangspunten" };

export default function UitgangspuntenPage() {
  return (
    <InfoPagina titel="Onze uitgangspunten" intro="Goed leren begint met vertrouwen. Deze uitgangspunten bepalen hoe we Mees ontwikkelen.">
      <InfoBlok titel="Gratis voor ieder kind">
        <p>Onze belofte is dat Mees voor kinderen altijd gratis blijft. Ouders hoeven geen financiële hulp aan te vragen om hun kind te laten oefenen. Donaties en een reserve moeten dit mogelijk maken.</p>
      </InfoBlok>
      <InfoBlok titel="Onderwijs blijft onafhankelijk">
        <p>Donateurs krijgen geen invloed op opdrachten, leeradviezen of onderwijsbeleid. Hun naam en logo kunnen met toestemming op de donateurspagina staan. Daar staan geen reclameboodschappen of ranglijsten.</p>
      </InfoBlok>
      <InfoBlok titel="Kindgegevens blijven privé">
        <p>We verkopen geen kindgegevens en geven ze niet aan donateurs. Een donatie geeft nooit toegang tot informatie over individuele kinderen.</p>
        <p>Voor kindprofielen gebruiken we een voornaam en een gekozen avatar. Voor voortgang en ouderfuncties zijn ook andere gegevens nodig, zoals oefenresultaten en oudercontactgegevens. In het uiteindelijke privacybeleid leggen we precies uit welke gegevens worden verwerkt, waarom, hoe lang en door wie.</p>
        <p className="text-tekst-zacht">Dit is een samenvatting van onze uitgangspunten, geen volledig privacybeleid.</p>
      </InfoBlok>
      <InfoBlok titel="Hulp met aandacht voor veiligheid">
        <p>Tutorhulp gebeurt binnen Mees, met toestemming en instellingen van de ouder. Tutoren hebben alleen toegang tot informatie die nodig is voor de hulp. Donateurs krijgen die toegang niet.</p>
        <p>Bij live-lessen zien kinderen elkaar niet en gaan vragen alleen naar de tutor. Opnames bevatten alleen de stem van de tutor en het bord, en worden gecontroleerd voordat ze terug te kijken zijn.</p>
      </InfoBlok>
      <InfoBlok titel="Leren zonder druk">
        <p>Kinderen kunnen stoppen en later verdergaan. Mees gebruikt geen punten, streaks of ranglijsten om kinderen zo lang mogelijk vast te houden. Heldere feedback, passende hulp en ruimte voor schermvrij leren staan centraal.</p>
      </InfoBlok>
    </InfoPagina>
  );
}
