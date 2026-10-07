import Link from "next/link";
import type { ReactNode } from "react";
import { Icoon, type AlleIcoonNamen } from "./Icoon";

export function TerugLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex min-h-12 items-center gap-2 rounded-[12px] px-2 text-[1.0625rem] font-bold text-actie-blauw hover:bg-blauw-zacht tablet:text-lg"
    >
      <Icoon naam="pijl-links" className="size-6" />
      {children}
    </Link>
  );
}

/** Rond label rechtsboven, bijvoorbeeld "Groep 6" of "8 van 8 afgerond". */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex min-h-10 items-center rounded-full bg-blauw-zacht px-4 text-base font-semibold text-inkt ${className}`}>
      {children}
    </span>
  );
}

/** Rond icoonvlak zoals op de onderwerptegels. */
export function IcoonRondje({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`grid size-14 shrink-0 place-items-center rounded-full bg-blauw-zacht text-actie-blauw tablet:size-16 ${className}`} aria-hidden>
      {children}
    </span>
  );
}

/**
 * OnderwerpTegel: wit/blauw-zacht vlak, icoon + naam + pijl. Als link of als niet-beschikbare tegel.
 */
export function OnderwerpTegel({
  href,
  naam,
  omschrijving,
  icoon,
  beeld,
  nietBeschikbaar,
}: {
  href?: string;
  naam: string;
  omschrijving?: string;
  icoon?: AlleIcoonNamen;
  beeld?: ReactNode;
  nietBeschikbaar?: string;
}) {
  const inhoud = (
    <>
      <IcoonRondje
        className={`${beeld ? "w-20 tablet:w-24" : ""} ${nietBeschikbaar ? "bg-uitgeschakeld-vlak text-uitgeschakeld-tekst" : ""}`}
      >
        {beeld ?? (icoon && <Icoon naam={icoon} className="size-8" />)}
      </IcoonRondje>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold leading-snug">{naam}</span>
        {(nietBeschikbaar ?? omschrijving) && (
          <span className="mt-0.5 block tekst-klein text-tekst-zacht">{nietBeschikbaar ?? omschrijving}</span>
        )}
      </span>
      {!nietBeschikbaar && <Icoon naam="chevron-rechts" className="size-6 text-actie-blauw" />}
    </>
  );
  const vorm = "flex min-h-24 items-center gap-4 rounded-[16px] border p-4 tablet:p-5";
  if (!href || nietBeschikbaar) {
    return <div className={`${vorm} border-rand-zacht bg-wit text-tekst-zacht`}>{inhoud}</div>;
  }
  return (
    <Link
      href={href}
      className={`${vorm} border-rand-zacht bg-[#f5faff] text-inkt transition-colors duration-[120ms] hover:border-actie-blauw hover:bg-blauw-zacht active:border-2 active:border-actie-blauw`}
    >
      {inhoud}
    </Link>
  );
}

/** Statusvlak voor laden, lege toestand, fouten en meldingen. */
export function Melding({
  soort = "info",
  children,
  className = "",
}: {
  soort?: "info" | "succes" | "probeer-opnieuw" | "fout";
  children: ReactNode;
  className?: string;
}) {
  const stijl = {
    info: "bg-blauw-zacht text-inkt",
    succes: "bg-succes-zacht text-succes",
    "probeer-opnieuw": "bg-probeer-opnieuw-zacht text-probeer-opnieuw",
    fout: "bg-fout-zacht text-fout",
  }[soort];
  const icoon = { info: "hint", succes: "check", "probeer-opnieuw": "hint", fout: "fout" }[soort] as AlleIcoonNamen;
  return (
    <div className={`flex items-start gap-3 rounded-[16px] p-4 ${stijl} ${className}`} role={soort === "fout" ? "alert" : undefined}>
      <Icoon naam={icoon} className="mt-0.5 size-6" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Laden() {
  return (
    <div className="mees-content py-12" aria-live="polite">
      <p className="text-tekst-zacht">Even wachten…</p>
    </div>
  );
}
