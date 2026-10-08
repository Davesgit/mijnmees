import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icoon } from "@/components/mees/Icoon";

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

      <section aria-labelledby="begroting-kop" className="rounded-[20px] bg-blauw-zacht p-5 tablet:p-8">
        <h2 id="begroting-kop" className="sr-only">
          Voorlopige begroting 2027
        </h2>
        <div className="grid gap-6 text-center tablet:grid-cols-2 tablet:divide-x tablet:divide-rand-zacht">
          <div>
            <span className="inline-block rounded-full bg-wit px-4 py-1 tekst-klein font-bold text-actie-blauw">Voorlopige begroting 2027</span>
            <p className="mt-3 text-5xl font-extrabold tabular-nums tablet:text-6xl">€ 179.000</p>
            <p className="mt-1 subtitel">Jaarlijkse kosten</p>
          </div>
          <div className="tablet:pt-10">
            <p className="text-5xl font-extrabold tabular-nums tablet:text-6xl">€ 179.000</p>
            <p className="mt-1 subtitel">Gewenste reserve</p>
            <p className="tekst-klein text-tekst-zacht">Voor 12 maanden op dit kostenniveau.</p>
          </div>
        </div>
        <p className="mt-6 border-t border-rand-zacht pt-4 text-center text-lg font-bold">Samen circa € 357.000, inclusief het opbouwen van de reserve.</p>
      </section>
      <p className="-mt-6 text-center tekst-klein text-tekst-zacht">Afgeronde bedragen. Ramingen voor een gefinancierde start met een fulltime leerkracht. Geen huidige uitgaven of ontvangen donaties.</p>

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

      <section aria-labelledby="cijfers-kop" className="rounded-[20px] bg-blauw-zacht p-5 tablet:p-8">
        <div className="flex flex-col gap-5 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <h2 id="cijfers-kop" className="titel-pagina">
              Wil je de cijfers bekijken?
            </h2>
            <p className="mt-1 text-tekst-zacht">Bekijk de aannames en de plannen voor de komende vijf jaar.</p>
          </div>
          <div className="flex flex-col items-stretch gap-2 tablet:items-end">
            <button type="button" disabled aria-describedby="download-uitleg" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-uitgeschakeld-vlak px-8 text-[1.125rem] font-bold text-uitgeschakeld-tekst">
              <Icoon naam="download" />
              Download de begroting
            </button>
            <p id="download-uitleg" className="tekst-klein text-tekst-zacht">
              De begroting is binnenkort te downloaden.
            </p>
          </div>
        </div>
        <p className="mt-5 border-t border-rand-zacht pt-3 tekst-klein text-tekst-zacht">Voorlopige begroting · Bijgewerkt oktober 2026 · Contactgegevens volgen bij publicatie van de begroting.</p>
      </section>
    </div>
  );
}
