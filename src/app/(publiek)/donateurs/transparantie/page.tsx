import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BegrotingBlok, DownloadBegroting } from "@/features/donateurs/InfoPagina";

export const metadata: Metadata = {
  title: "Wat kost Mees?",
  description: "Voorlopige begroting: wat is nodig om Mees goed en gratis te houden?",
};

// Voorlopige begroting (peildatum oktober 2026). Afgeronde bedragen; totaal berekend €357.370.
const kosten = [
  { icoon: "icoon-leerinhoud", titel: "Leerinhoud en kwaliteit", tekst: "Goede vragen, hints en uitleg." },
  { icoon: "icoon-tutoren", titel: "Tutoren en begeleiding", tekst: "Persoonlijke hulp en live lessen." },
  { icoon: "icoon-techniek", titel: "Techniek en onderhoud", tekst: "Een platform dat goed blijft werken." },
  { icoon: "icoon-veiligheid", titel: "Organisatie en veiligheid", tekst: "Privacy, administratie en continuïteit." },
];

export default function TransparantiePage() {
  return (
    <div className="mees-content flex flex-col gap-10 py-8 tablet:max-w-[1000px] tablet:py-12">
      <div>
        <nav aria-label="Kruimelpad" className="tekst-klein text-tekst-zacht">
          <Link href="/donateurs" className="underline underline-offset-4 hover:text-actie-blauw">
            Onze donateurs
          </Link>{" "}
          / <span aria-current="page">Transparantie</span>
        </nav>
        <div className="mt-4 grid items-center gap-6 tablet:grid-cols-[1fr_auto]">
          <div>
            <h1 className="titel-held">Wat kost Mees?</h1>
            <p className="mt-2 subtitel font-bold">Gratis voor kinderen. Mogelijk gemaakt door donaties.</p>
            <p className="mt-2 tekst-intro text-tekst-zacht">We laten graag zien wat nodig is om Mees goed en gratis te houden.</p>
          </div>
          <Image src="/assets/transparantie/mees-bouwt-aan-later.png" alt="" width={1536} height={1024} priority sizes="(min-width: 768px) 300px, 70vw" className="mx-auto w-56 object-contain tablet:w-72" />
        </div>
      </div>

      <BegrotingBlok />

      <section aria-labelledby="geld-kop">
        <h2 id="geld-kop" className="titel-pagina">
          Waar gaat het geld naartoe?
        </h2>
        <ul className="mt-4 grid gap-4 tablet:grid-cols-2">
          {kosten.map((k) => (
            <li key={k.titel} className="flex items-center gap-4 rounded-[20px] border border-rand-zacht bg-wit p-5">
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-blauw-zacht" aria-hidden>
                <Image src={`/assets/transparantie/${k.icoon}.svg`} alt="" width={32} height={32} className="size-8" />
              </span>
              <span>
                <span className="block subtitel">{k.titel}</span>
                <span className="block text-tekst-zacht">{k.tekst}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="titel-pagina">Zekerheid voor later.</h2>
        <p className="mt-2 tekst-intro">Meerjarige donaties helpen ons vooruit te plannen en een reserve op te bouwen.</p>
        <p className="mt-1 text-tekst-zacht">Mees wordt nu opgebouwd met eigen geld en tijd van de oprichter.</p>
      </section>

      <DownloadBegroting titel="Wil je de cijfers bekijken?" tekst="Bekijk de aannames en de plannen voor de komende vijf jaar." />
    </div>
  );
}
