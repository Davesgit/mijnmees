import Image from "next/image";
import Link from "next/link";
import { BreukKaartjes } from "@/components/mees/Breuk";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { InstallTip } from "@/components/mees/Webapp";
import { Mees } from "@/components/mees/Mees";

export default function Home() {
  return (
    <>
      <section className="mees-content grid items-center gap-8 py-8 tablet:py-12 desktop:grid-cols-[1fr_1.05fr] desktop:gap-12 desktop:py-16">
        <div>
          <h1 className="titel-held desktop:text-[3.25rem]">Leren op jouw niveau</h1>
          <p className="mt-3 subtitel font-semibold text-tekst-zacht">Voor ieder kind. Voor altijd gratis.</p>
          <p className="mt-4 max-w-xl text-lg">
            Mees helpt kinderen van groep 5 tot en met 8 zelfstandig oefenen, met hints en uitleg wanneer dat nodig is. Zonder punten,
            ranglijsten of advertenties.
          </p>
          <div className="mt-6 flex flex-col gap-3 min-[480px]:flex-row">
            <PrimaireKnop href="/kind/start" groot>
              Probeer Mees
              <Icoon naam="pijl-rechts" />
            </PrimaireKnop>
            <SecundaireKnop href="/ouder/account-aanmaken" groot>
              Maak een ouderaccount
            </SecundaireKnop>
          </div>
        </div>
        <Image
          src="/assets/fotos/ouder-kind-leren.jpg"
          alt="Een ouder en een kind kijken samen naar een laptop."
          width={1536}
          height={1024}
          priority
          sizes="(min-width: 1024px) 600px, 100vw"
          className="aspect-[3/2] w-full rounded-[20px] object-cover"
        />
      </section>

      <div className="mees-content">
        <InstallTip />
      </div>

      <section aria-label="Wat Mees doet" className="mees-content grid gap-8 py-8 tablet:grid-cols-3 tablet:py-12">
        <Kenmerk
          beeld={
            <div className="flex items-end gap-2">
              <Mees pose="helpt" breedte={120} className="w-28" />
            </div>
          }
          titel="Oefenen met gerichte hulp"
          tekst="Bij een fout antwoord volgt eerst een hint, dan nog een, en daarna rustige uitleg. Daarna komt een soortgelijke vraag terug."
        />
        <Kenmerk
          beeld={<BreukKaartjes links={[1, 3]} rechts={[2, 5]} teken="<" klein />}
          titel="Op het eigen tempo"
          tekst="Je kind kiest zelf wat het oefent, of volgt het voorstel van Mees. Stoppen mag altijd; later gaat het verder waar het was."
        />
        <Kenmerk
          beeld={
            <div className="flex w-48 flex-col gap-2 rounded-[16px] border border-rand-zacht bg-wit p-4 text-left text-base">
              <span className="font-bold">Voortgang</span>
              {["Gaat zelfstandig", "Aan het oefenen"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <Icoon naam="check" className="size-5 text-succes" />
                  {t}
                </span>
              ))}
            </div>
          }
          titel="Inzicht voor ouders"
          tekst="Zie per oefening wat zelfstandig lukte en waar hulp nodig was. Mees kijkt naar meerdere oefenmomenten, niet naar één goed antwoord."
        />
      </section>

      <section className="mees-content py-6">
        <div className="flex flex-col items-start gap-6 rounded-[20px] bg-blauw-zacht p-6 tablet:flex-row tablet:items-center tablet:p-10">
          <Mees pose="blij" breedte={140} className="w-28 shrink-0 tablet:w-32" />
          <div>
            <h2 className="titel-pagina">Mees is er voor alle kinderen</h2>
            <p className="mt-2 max-w-2xl text-lg text-tekst-zacht">
              Mees is gratis, dankzij donateurs die goed onderwijs belangrijk vinden. Donateurs krijgen geen gegevens en hebben geen invloed op de
              lesinhoud.
            </p>
            <Link href="/donateurs" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-wit px-5 font-bold text-actie-blauw hover:bg-[#f5faff]">
              Meer over onze donateurs
              <Icoon naam="pijl-rechts" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mees-content grid items-center gap-6 py-10 tablet:py-16 desktop:grid-cols-2">
        <div>
          <h2 className="titel-pagina">Klaar om te starten?</h2>
          <p className="mt-2 text-lg text-tekst-zacht">
            Je kind kan meteen proberen, zonder account. Met een gratis ouderaccount bewaart Mees de voortgang op elk apparaat.
          </p>
          <div className="mt-6 flex flex-col gap-3 min-[480px]:flex-row">
            <PrimaireKnop href="/kind/start" groot>
              Probeer Mees
              <Icoon naam="pijl-rechts" />
            </PrimaireKnop>
            <SecundaireKnop href="/ouder/account-aanmaken" groot>
              Maak een ouderaccount
            </SecundaireKnop>
          </div>
        </div>
        <div className="flex justify-center">
          <Mees pose="juicht" breedte={260} className="w-48 tablet:w-60" />
        </div>
      </section>
    </>
  );
}

function Kenmerk({ beeld, titel, tekst }: { beeld: React.ReactNode; titel: string; tekst: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-36 items-center" aria-hidden>
        {beeld}
      </div>
      <h3 className="subtitel">{titel}</h3>
      <p className="text-tekst-zacht">{tekst}</p>
    </div>
  );
}
