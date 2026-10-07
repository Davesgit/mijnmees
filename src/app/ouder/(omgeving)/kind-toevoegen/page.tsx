import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden, TerugLink } from "@/components/mees/Bouwstenen";
import { vereisOntgrendeldeOuder } from "@/lib/server/dal";
import { KindFormulier } from "./KindFormulier";

export const metadata: Metadata = { title: "Voeg een kind toe" };

export default function KindToevoegenPage() {
  return (
    <div className="mees-content py-6 tablet:max-w-3xl tablet:py-10">
      <TerugLink href="/profielen">Terug</TerugLink>
      <h1 className="mt-2 titel-held">Voeg een kind toe</h1>
      <p className="mt-2 tekst-intro text-tekst-zacht">Alleen een voornaam, een groep en een dier. Je kunt dit later wijzigen.</p>
      <Suspense fallback={<Laden />}>
        <Inhoud />
      </Suspense>
    </div>
  );
}

async function Inhoud() {
  await vereisOntgrendeldeOuder("/ouder/kind-toevoegen");
  return <KindFormulier />;
}
