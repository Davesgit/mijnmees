import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { AanmeldFormulier } from "@/features/donateurs/AanmeldFormulier";
import { DoneerKaart } from "@/features/donateurs/DoneerKaart";

export const metadata: Metadata = {
  title: "Onze donateurs",
  description: "Mees is gratis voor kinderen. Steun Mees met een gift of meerjarige steun.",
};

const beloftes = [
  { icoon: "icoon-people", tekst: "Altijd gratis voor kinderen" },
  { icoon: "icoon-cap", tekst: "Onafhankelijk" },
  { icoon: "icoon-shield", tekst: "Kindgegevens blijven privé" },
];

const vertrouwen = [
  { icoon: "icoon-pie", titel: "Waar gaat je gift naartoe?", tekst: "Platform, lesinhoud, tutorhulp en een reserve voor later.", href: "/donateurs/besteding", link: "Lees meer" },
  { icoon: "icoon-shield", titel: "Onafhankelijk en veilig", tekst: "Donateurs krijgen geen kindgegevens of invloed op de leerinhoud.", href: "/donateurs/uitgangspunten", link: "Onze uitgangspunten" },
  { icoon: "icoon-building", titel: "Stichting en ANBI", tekst: "Een stichting en ANBI-status zijn ons toekomstplan. Mees heeft nu geen ANBI-status.", href: "/donateurs/stichting-en-anbi", link: "Bekijk onze plannen" },
];

export default function DonateursPage() {
  return (
    <div className="mees-content flex flex-col gap-10 py-8 tablet:gap-12 tablet:py-12">
      {/* Hero */}
      <section className="grid items-center gap-8 tablet:grid-cols-2">
        <div>
          <p className="font-semibold text-tekst-zacht">Samen maken we Mees mogelijk</p>
          <h1 className="mt-2 titel-held">Geef ieder kind de ruimte om te leren.</h1>
          <p className="mt-4 tekst-intro">Gratis oefenen en hulp voor kinderen in Nederland. Samen verlagen we drempels en geven we meer kinderen gelijke kansen.</p>
          <div className="mt-6 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap [&>*]:whitespace-nowrap">
            <PrimaireKnop href="#doneren" groot>
              Doneer direct
              <Icoon naam="pijl-rechts" />
            </PrimaireKnop>
            <SecundaireKnop href="#aanmelden" groot>
              Steun meerdere jaren
            </SecundaireKnop>
          </div>
          <p className="mt-3 tekst-klein text-tekst-zacht">Voor mensen, bedrijven en organisaties.</p>
        </div>
        <Image src="/assets/donateurs/kind-oefent-thuis.jpg" alt="Een kind oefent thuis aan tafel met een laptop en een schrift." width={1536} height={1024} priority sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[3/2] w-full rounded-[20px] object-cover" />
      </section>

      <ul className="grid gap-3 border-y border-rand-zacht py-4 tablet:grid-cols-3">
        {beloftes.map((b) => (
          <li key={b.tekst} className="flex items-center justify-center gap-3 font-bold">
            <Image src={`/assets/donateurs/${b.icoon}.svg`} alt="" width={32} height={32} className="size-8" />
            {b.tekst}
          </li>
        ))}
      </ul>

      <div className="grid gap-5 tablet:grid-cols-2">
        <DoneerKaart />
        <section aria-labelledby="later-kop" className="flex flex-col rounded-[20px] bg-blauw-zacht p-5 tablet:p-6">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <h2 id="later-kop" className="subtitel">
                Geef zekerheid voor later.
              </h2>
              <p className="mt-2">Meerjarige steun helpt ons vooruit te plannen en een reserve op te bouwen. Zo kunnen kinderen ook de komende jaren blijven oefenen.</p>
            </div>
            <Image src="/assets/donateurs/mees-doneert.png" alt="" width={1536} height={1024} sizes="160px" className="hidden w-36 object-contain min-[480px]:block tablet:w-40" />
          </div>
          <div className="mt-auto pt-5">
            <SecundaireKnop href="#aanmelden">
              Meld je aan als donateur
              <Icoon naam="pijl-rechts" />
            </SecundaireKnop>
            <p className="mt-2 tekst-klein text-tekst-zacht">Bedrag en looptijd bespreken we samen.</p>
          </div>
        </section>
      </div>

      <section className="grid items-center gap-8 tablet:grid-cols-2">
        <Image src="/assets/donateurs/ouder-kind-werkblad.jpg" alt="Een ouder helpt een kind met een werkblad." width={1536} height={1024} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[3/2] w-full rounded-[20px] object-cover" />
        <div>
          <h2 className="titel-pagina">Leren mag niet afhangen van je portemonnee.</h2>
          <p className="mt-3 text-lg">Een betaald oefenabonnement past niet in ieder gezinsbudget. Bij Mees kan ieder kind gratis oefenen, zonder eerst financiële hulp aan te vragen.</p>
          <ul className="mt-4 flex flex-col gap-2 text-lg">
            {["Oefenen op eigen niveau", "Uitleg en hulp als het lastig wordt", "Ook werkbladen voor thuis"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
                  <Icoon naam="check" className="size-4" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="vertrouwen-kop">
        <h2 id="vertrouwen-kop" className="titel-pagina">
          Een bijdrage met vertrouwen.
        </h2>
        <ul className="mt-4 grid gap-4 tablet:grid-cols-3">
          {vertrouwen.map((v) => (
            <li key={v.titel} className="flex gap-4 rounded-[20px] border border-rand-zacht bg-wit p-5">
              <Image src={`/assets/donateurs/${v.icoon}.svg`} alt="" width={40} height={40} className="size-10 shrink-0" />
              <div className="flex flex-col">
                <h3 className="font-bold">{v.titel}</h3>
                <p className="mt-1 tekst-klein text-tekst-zacht">{v.tekst}</p>
                <Link href={v.href} className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-actie-blauw underline underline-offset-4">
                  {v.link}
                  <Icoon naam="pijl-rechts" className="size-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          <Link href="/donateurs/transparantie" className="inline-flex min-h-12 items-center gap-1 font-bold text-actie-blauw underline underline-offset-4">
            Wat kost Mees? Bekijk de voorlopige begroting
            <Icoon naam="pijl-rechts" className="size-4" />
          </Link>
        </p>
      </section>

      {/* Geen voorbeeldbedrijven tonen: alleen echte donateurs, met toestemming. */}
      <section aria-labelledby="dank-kop">
        <h2 id="dank-kop" className="titel-pagina">
          Dank aan onze donateurs.
        </h2>
        <p className="mt-1 text-tekst-zacht">Samen houden we leren toegankelijk.</p>
        <p className="mt-4 rounded-[20px] border border-dashed border-rand-interactief bg-wit p-6 text-center text-lg">Hier komen de namen en logo&apos;s van onze eerste donateurs, alleen met hun toestemming.</p>
      </section>

      <AanmeldFormulier />
    </div>
  );
}
