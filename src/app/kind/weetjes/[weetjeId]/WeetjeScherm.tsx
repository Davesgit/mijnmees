"use client";

import Image from "next/image";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { SecundaireKnop } from "@/components/mees/Knoppen";
import { VoorleesKnop } from "@/components/mees/Voorlezen";
import { weetjeVoorleesTekst } from "@/features/voorlezen/teksten";
import { vindWeetje } from "@/content/weetjes";
import { useOpslag } from "@/lib/opslag/lokaal";

export function WeetjeScherm({ weetjeId }: { weetjeId: string }) {
  const opslag = useOpslag();
  const weetje = vindWeetje(weetjeId)!;
  if (opslag === null) return <Laden />;

  const isOntdekt = opslag.weetjes.some((w) => w.weetjeId === weetjeId);

  if (!isOntdekt) {
    return (
      <div className="mees-content py-6 tablet:py-8">
        <TerugLink href="/kind/weetjesboek">Weetjesboek</TerugLink>
        <h1 className="mt-4 titel-pagina">Nog te ontdekken</h1>
        <Melding className="mt-6">Dit weetje is nog niet ontdekt. Na het oefenen ontdek je een nieuw weetje.</Melding>
      </div>
    );
  }

  return (
    <article className="mees-content flex flex-col gap-6 py-6 tablet:py-8 desktop:py-10">
      <TerugLink href="/kind/weetjesboek">Weetjesboek</TerugLink>
      <div className="grid items-start gap-6 tablet:gap-10 desktop:grid-cols-[1fr_1.1fr] desktop:gap-14">
        <div className="order-2 desktop:order-1">
          <p className="font-semibold text-actie-blauw">{weetje.categorie}</p>
          <h1 className="mt-1 titel-held">{weetje.titel}</h1>
          <p className="mt-2 subtitel font-semibold text-[#4b5e9a]">{weetje.kort}</p>
          <VoorleesKnop tekst={weetjeVoorleesTekst(weetje)} className="mt-6 border-transparent bg-blauw-zacht" />
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed tablet:text-xl tablet:leading-relaxed">{weetje.tekst}</p>
          {!weetje.bronGecontroleerd && (
            <p className="mt-4 tekst-klein text-tekst-zacht">De bron van dit weetje wordt nog gecontroleerd.</p>
          )}
        </div>
        <Image
          src={weetje.foto}
          alt={weetje.alt}
          width={1536}
          height={1024}
          priority
          sizes="(min-width: 1024px) 600px, 100vw"
          className="order-1 aspect-[3/2] w-full rounded-[20px] object-cover desktop:order-2"
        />
      </div>
      <div className="border-t border-rand-zacht pt-6">
        <SecundaireKnop href="/kind/weetjesboek">
          <Icoon naam="pijl-links" />
          Terug naar weetjesboek
        </SecundaireKnop>
      </div>
    </article>
  );
}
