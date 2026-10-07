"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Breuk, BreukKaartjes } from "@/components/mees/Breuk";
import { Label, Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { Mees } from "@/components/mees/Mees";
import { vindOnderdeel } from "@/content/onderwerpen";
import { vindWeetje } from "@/content/weetjes";
import { sessieStatistiek } from "@/features/oefenen/sessie";
import { useOpslag } from "@/lib/opslag/lokaal";

export function AfgerondScherm({ sessieId }: { sessieId: string }) {
  const opslag = useOpslag();
  if (opslag === null) return <Laden />;

  const sessie = opslag.sessies[sessieId];
  if (!sessie || sessie.status !== "afgerond") {
    return (
      <div className="mees-content py-10">
        <h1 className="titel-pagina">Oefening</h1>
        <Melding className="mt-6">
          Nog niet afgerond. Je kunt verder waar je was.{" "}
          <Link href={sessie ? `/kind/oefenen/${sessie.id}` : "/kind/start"} className="font-bold text-actie-blauw underline underline-offset-4">
            Verder oefenen
          </Link>
        </Melding>
      </div>
    );
  }

  const { zelfstandig, aantal } = sessieStatistiek(sessie);
  const onderdeel = vindOnderdeel(sessie.onderdeelId);
  const ontdekt = opslag.weetjes.find((w) => w.sessieId === sessie.id);
  const weetje = ontdekt ? vindWeetje(ontdekt.weetjeId) : null;

  const samenvatting =
    zelfstandig === 0
      ? "Je hebt alle vragen gemaakt, met hulp. Zo leer je erbij."
      : `Bij ${zelfstandig} van de ${aantal} vragen lukte het zonder hulp.`;

  return (
    <div className="mees-content flex flex-col gap-6 py-4 tablet:max-w-[1100px] tablet:gap-8 tablet:py-6 desktop:py-8">
      <div className="hidden grid-cols-[auto_1fr_auto] items-center gap-8 tablet:grid">
        <TerugLink href={`/kind/oefening/instellen?onderdeel=${sessie.onderdeelId}`}>{onderdeel?.onderdeel.naam ?? "Terug"}</TerugLink>
        <div>
          <p className="text-base font-bold">
            Vraag {aantal} van {aantal}
          </p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {sessie.slots.map((s) => (
              <span key={s.id} className="h-2.5 flex-1 rounded-full bg-merk-blauw" />
            ))}
          </div>
        </div>
        <Label>
          {aantal} van {aantal} afgerond
        </Label>
      </div>

      <section className="flex flex-col items-center text-center" aria-labelledby="afgerond-titel">
        <div className="flex items-end gap-2" aria-hidden>
          <Mees pose="juicht" breedte={150} prioriteit className="w-28 tablet:w-36" />
          <BreukKaartjes links={[1, 2]} rechts={[3, 4]} klein />
        </div>
        <h1 id="afgerond-titel" className="mt-4 titel-held">
          Goed geoefend!
        </h1>
        <p className="mt-2 subtitel font-semibold text-[#5b6fae]">{samenvatting}</p>
      </section>

      {weetje && (
        <Link
          href={`/kind/weetjes/${weetje.id}`}
          className="group grid items-center gap-4 rounded-[16px] bg-blauw-zacht p-4 transition-colors hover:bg-[#dcecfd] min-[480px]:grid-cols-[auto_1fr] tablet:gap-8 tablet:p-6"
        >
          <Image
            src={weetje.foto}
            alt=""
            width={1536}
            height={1024}
            sizes="(min-width: 768px) 240px, 100vw"
            className="aspect-[3/2] w-full rounded-[12px] object-cover min-[480px]:w-40 tablet:w-60"
          />
          <span className="min-[480px]:border-l min-[480px]:border-rand-zacht min-[480px]:pl-6">
            <span className="block subtitel">Wist je dat?</span>
            <span className="mt-1 block text-lg">{weetje.kort}</span>
            <span className="mt-1 inline-flex items-center gap-1 tekst-klein font-semibold text-actie-blauw group-hover:underline">
              Bewaard in je weetjesboek. Bekijk het weetje
              <Icoon naam="chevron-rechts" className="size-5" />
            </span>
          </span>
        </Link>
      )}

      <nav aria-label="Wat wil je nu doen?" className="grid gap-3 tablet:grid-cols-3 tablet:gap-4">
        <KeuzeTegel
          href={`/kind/oefening/instellen?onderdeel=${sessie.onderdeelId}`}
          titel="Verder oefenen"
          tekst={`${onderdeel?.onderwerp.naam ?? "Rekenen"}: oefen nog een keer.`}
          beeld={<Breuk teller={1} noemer={2} className="text-xl font-extrabold" />}
        />
        <KeuzeTegel href="/kind/pauze" titel="Even bewegen" tekst="Sta op en loop een rondje." beeld={<Icoon naam="bewegen" className="size-8" />} />
        <KeuzeTegel href="/kind/start" titel="Klaar voor nu" tekst="Je voortgang staat op dit apparaat." beeld={<Icoon naam="huis" className="size-8" />} />
      </nav>
    </div>
  );
}

function KeuzeTegel({ href, titel, tekst, beeld }: { href: string; titel: string; tekst: string; beeld: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-[16px] border border-rand-zacht bg-wit p-4 transition-colors hover:border-actie-blauw hover:bg-blauw-zacht tablet:flex-col tablet:p-6 tablet:text-center"
    >
      <span className="grid size-16 shrink-0 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
        {beeld}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block subtitel">{titel}</span>
        <span className="mt-1 block text-actie-blauw">{tekst}</span>
      </span>
      <Icoon naam="chevron-rechts" className="size-6 text-actie-blauw" />
    </Link>
  );
}
