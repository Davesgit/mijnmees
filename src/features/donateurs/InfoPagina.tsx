import Link from "next/link";
import type { ReactNode } from "react";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";

/** Gedeelde opbouw van de informatiepagina's onder Onze donateurs. */
export function InfoPagina({ titel, intro, children }: { titel: string; intro: string; children: ReactNode }) {
  return (
    <div className="mees-content flex flex-col gap-8 py-8 tablet:max-w-[860px] tablet:py-12">
      <div>
        <Link href="/donateurs" className="inline-flex min-h-12 items-center gap-2 rounded-[12px] font-semibold text-actie-blauw hover:underline">
          <Icoon naam="pijl-links" className="size-5" />
          Terug naar onze donateurs
        </Link>
        <p className="mt-2 font-semibold text-tekst-zacht">Samen maken we Mees mogelijk</p>
        <h1 className="mt-1 titel-held">{titel}</h1>
        <p className="mt-3 tekst-intro text-tekst-zacht">{intro}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
      <SteunBlok />
    </div>
  );
}

export function InfoBlok({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] border border-rand-zacht bg-wit p-5 tablet:p-6">
      <h2 className="subtitel">{titel}</h2>
      <div className="mt-2 flex flex-col gap-2 text-lg">{children}</div>
    </section>
  );
}

export function SteunBlok() {
  return (
    <section className="flex flex-col gap-4 rounded-[20px] bg-blauw-zacht p-5 tablet:flex-row tablet:items-center tablet:justify-between tablet:p-6">
      <div>
        <h2 className="subtitel">Help kinderen verder leren.</h2>
        <p className="mt-1 text-tekst-zacht">Elke bijdrage is welkom. Meerjarige steun geeft ruimte om vooruit te plannen.</p>
      </div>
      <div className="flex flex-col gap-2 min-[480px]:flex-row">
        <PrimaireKnop href="/donateurs#doneren">Doneer direct</PrimaireKnop>
        <SecundaireKnop href="/donateurs#aanmelden">Steun meerdere jaren</SecundaireKnop>
      </div>
    </section>
  );
}
