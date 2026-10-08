import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, TerugLink } from "@/components/mees/Bouwstenen";
import { SecundaireKnop } from "@/components/mees/Knoppen";
import { PrintKnop } from "@/features/werkbladen/PrintKnop";
import { WerkbladBlad } from "@/features/werkbladen/WerkbladBlad";
import { haalEigenWerkblad } from "@/features/werkbladen/server";
import { vereisOntgrendeldeOuder } from "@/lib/server/dal";

export const metadata: Metadata = { title: "Antwoordblad" };

type Props = PageProps<"/ouder/werkbladen/[werkbladId]/antwoorden">;

/** W04: antwoordblad, alleen voor de ontgrendelde ouderomgeving. */
export default function AntwoordenPage({ params }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10 print:p-0">
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params }: Pick<Props, "params">) {
  const { werkbladId } = await params;
  await vereisOntgrendeldeOuder(`/ouder/werkbladen/${werkbladId}/antwoorden`);
  const werkblad = await haalEigenWerkblad(werkbladId);
  if (!werkblad) notFound();
  return (
    <>
      <div className="flex flex-col gap-4 print:hidden">
        <TerugLink href="/ouder">Terug naar het overzicht</TerugLink>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="titel-pagina">Antwoordblad</h1>
          <div className="flex flex-wrap gap-3">
            <SecundaireKnop href={`/ouder/werkbladen/${werkblad.id}/resultaten`}>Resultaten invullen</SecundaireKnop>
            <PrintKnop>Print antwoordblad</PrintKnop>
          </div>
        </div>
      </div>
      <WerkbladBlad werkblad={werkblad} metAntwoorden />
    </>
  );
}
