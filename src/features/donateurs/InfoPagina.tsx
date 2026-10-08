import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";

// Bouwstenen voor de pagina's onder Onze donateurs (besteding, uitgangspunten, stichting, transparantie).

export const BEGROTING_PDF = "/downloads/mees-begroting.pdf";

export function PaginaHero({ kruimel, badge, titel, intro, beeld }: { kruimel: string; badge?: string; titel: string; intro: string; beeld: "mees-bouwt-aan-later" | "mees-doneert" }) {
  return (
    <div>
      <nav aria-label="Kruimelpad" className="tekst-klein text-tekst-zacht">
        <Link href="/donateurs" className="underline underline-offset-4 hover:text-actie-blauw">
          Onze donateurs
        </Link>{" "}
        / <span aria-current="page">{kruimel}</span>
      </nav>
      <div className="mt-4 grid items-center gap-6 tablet:grid-cols-[1fr_auto]">
        <div>
          {badge && <span className="inline-block rounded-full bg-blauw-zacht px-4 py-1 tekst-klein font-bold text-actie-blauw">{badge}</span>}
          <h1 className={`titel-held ${badge ? "mt-3" : ""}`}>{titel}</h1>
          <p className="mt-3 tekst-intro text-tekst-zacht">{intro}</p>
        </div>
        <Image src={`/assets/donateurs/${beeld}.png`} alt="" width={1536} height={1024} priority sizes="(min-width: 768px) 300px, 70vw" className="mx-auto w-56 object-contain tablet:w-72" />
      </div>
    </div>
  );
}

export function Tegels({ items }: { items: { icoon: string; titel: string; tekst: string }[] }) {
  return (
    <ul className="grid gap-4 tablet:grid-cols-2">
      {items.map((t) => (
        <li key={t.titel} className="flex items-start gap-4 rounded-[20px] border border-rand-zacht bg-wit p-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-[14px] bg-blauw-zacht" aria-hidden>
            <Image src={`/assets/donateurs/${t.icoon}.svg`} alt="" width={28} height={28} className="size-7" />
          </span>
          <span>
            <span className="block subtitel">{t.titel}</span>
            <span className="mt-1 block text-tekst-zacht">{t.tekst}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Split({ foto, alt, titel, children }: { foto: "ouder-kind-werkblad" | "kind-oefent-thuis"; alt: string; titel: string; children: ReactNode }) {
  return (
    <section className="grid items-center gap-6 tablet:grid-cols-2 tablet:gap-8">
      <Image src={`/assets/donateurs/${foto}.jpg`} alt={alt} width={1536} height={1024} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[3/2] w-full rounded-[20px] object-cover" />
      <div>
        <h2 className="titel-pagina">{titel}</h2>
        <div className="mt-3 flex flex-col gap-2 text-lg">{children}</div>
      </div>
    </section>
  );
}

export function Uitklap({ vraag, children }: { vraag: string; children: ReactNode }) {
  return (
    <details className="group rounded-[16px] border border-rand-zacht bg-wit">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 font-bold [&::-webkit-details-marker]:hidden">
        {vraag}
        <Icoon naam="chevron-omlaag" className="size-6 shrink-0 text-actie-blauw transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-2 px-5 pb-5">{children}</div>
    </details>
  );
}

export function Cta({ titel, tekst, knop, href }: { titel: string; tekst: string; knop: string; href: string }) {
  return (
    <section className="flex flex-col gap-4 rounded-[20px] bg-blauw-zacht p-5 tablet:flex-row tablet:items-center tablet:justify-between tablet:p-8">
      <div>
        <h2 className="titel-pagina">{titel}</h2>
        <p className="mt-1 text-tekst-zacht">{tekst}</p>
      </div>
      <PrimaireKnop href={href} className="shrink-0 whitespace-nowrap">
        {knop}
        <Icoon naam="pijl-rechts" />
      </PrimaireKnop>
    </section>
  );
}

/** Voorlopige begroting 2027 (afgeronde bedragen; berekend totaal €357.370). */
export function BegrotingBlok({ titel }: { titel?: string }) {
  return (
    <section aria-labelledby="begroting-kop" className="rounded-[20px] bg-blauw-zacht p-5 tablet:p-8">
      <h2 id="begroting-kop" className={titel ? "titel-pagina mb-5" : "sr-only"}>
        {titel ?? "Voorlopige begroting 2027"}
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
      <p className="mt-2 text-center tekst-klein text-tekst-zacht">Afgeronde bedragen. Ramingen voor een gefinancierde start met een fulltime leerkracht. Geen huidige uitgaven of ontvangen donaties.</p>
    </section>
  );
}

export function DownloadBegroting({ titel, tekst }: { titel: string; tekst: string }) {
  return (
    <section className="rounded-[20px] bg-blauw-zacht p-5 tablet:p-8">
      <div className="flex flex-col gap-5 tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <h2 className="titel-pagina">{titel}</h2>
          <p className="mt-1 text-tekst-zacht">{tekst}</p>
        </div>
        <a href={BEGROTING_PDF} download className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-actie-blauw px-8 text-[1.125rem] font-bold text-wit hover:bg-actie-hover">
          <Icoon naam="download" />
          Download de begroting
        </a>
      </div>
      <p className="mt-5 border-t border-rand-zacht pt-3 tekst-klein text-tekst-zacht">Voorlopige begroting · Bijgewerkt oktober 2026 · PDF, 2 pagina&apos;s (2 MB)</p>
    </section>
  );
}

export const kostenTegels = [
  { icoon: "icoon-leerinhoud", titel: "Goede leerinhoud", tekst: "Vragen, hints en uitleg die inhoudelijk worden gecontroleerd." },
  { icoon: "icoon-tutoren", titel: "Hulp als het moeilijk is", tekst: "Tutoren, begeleiding en lessen die kinderen verder helpen." },
  { icoon: "icoon-techniek", titel: "Een platform dat werkt", tekst: "Ontwikkeling, onderhoud en een prettige werking op ieder apparaat." },
  { icoon: "icoon-veiligheid", titel: "Zorgvuldig georganiseerd", tekst: "Privacy, veiligheid, administratie en continuïteit." },
];
