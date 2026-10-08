import type { Metadata } from "next";
import { BegrotingBlok, DownloadBegroting, kostenTegels, PaginaHero, Split, Tegels } from "@/features/donateurs/InfoPagina";

export const metadata: Metadata = { title: "Waar gaat je gift naartoe?" };

export default function BestedingPage() {
  return (
    <div className="mees-content flex flex-col gap-10 py-8 tablet:max-w-[1000px] tablet:py-12">
      <PaginaHero kruimel="Waar gaat je gift naartoe?" titel="Waar gaat je gift naartoe?" intro="Samen bouwen we aan goed onderwijs dat voor ieder kind gratis blijft." beeld="mees-bouwt-aan-later" />
      <Tegels items={kostenTegels} />
      <BegrotingBlok titel="Wat is er straks nodig?" />
      <Split foto="ouder-kind-werkblad" alt="Een ouder helpt een kind met een werkblad." titel="Ook voor later zekerheid.">
        <p>Meerjarige steun helpt ons vooruit te plannen en een reserve op te bouwen.</p>
        <p className="text-tekst-zacht">De ontwikkeling wordt nu betaald met eigen geld en tijd van de oprichter.</p>
      </Split>
      <DownloadBegroting titel="De cijfers, rustig uitgelegd." tekst="Bekijk de kosten, aannames en plannen voor vijf jaar." />
    </div>
  );
}
