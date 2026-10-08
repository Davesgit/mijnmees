import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, TerugLink } from "@/components/mees/Bouwstenen";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { opgaveTekst, vindVraag } from "@/features/oefenen/vragen";
import { haalEigenWerkblad } from "@/features/werkbladen/server";
import { haalKinderen, vereisOntgrendeldeOuder } from "@/lib/server/dal";
import { createClient } from "@/lib/supabase/server";
import { PapierFormulier, type Regel } from "./PapierFormulier";

export const metadata: Metadata = { title: "Papierresultaten" };

type Props = PageProps<"/ouder/werkbladen/[werkbladId]/resultaten">;

/** O04: de ouder vult na het nakijken in wat er goed ging. Papierwerk blijft los van digitaal bewijs. */
export default function ResultatenPage({ params, searchParams }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-[900px] tablet:py-10">
      <TerugLink href="/ouder">Terug naar het overzicht</TerugLink>
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { werkbladId } = await params;
  await vereisOntgrendeldeOuder(`/ouder/werkbladen/${werkbladId}/resultaten`);
  const werkblad = await haalEigenWerkblad(werkbladId);
  if (!werkblad) notFound();
  const kinderen = await haalKinderen();
  if (kinderen.length === 0) {
    return (
      <>
        <h1 className="titel-pagina">Papierresultaten</h1>
        <p>Voeg eerst een kind toe. Daarna kun je hier invullen hoe het werkblad ging.</p>
        <PrimaireKnop href="/ouder/kind-toevoegen" className="self-start">
          Kind toevoegen
        </PrimaireKnop>
      </>
    );
  }
  const { kind: gekozenParam } = await searchParams;
  const kind = kinderen.find((k) => k.id === gekozenParam) ?? kinderen.find((k) => k.id === werkblad.kindId) ?? kinderen[0];

  const supabase = await createClient();
  const { data: laatste } = await supabase
    .from("papier_resultaten")
    .select("versie, regels, op")
    .eq("werkblad_id", werkblad.id)
    .eq("kind_id", kind.id)
    .order("versie", { ascending: false })
    .limit(1)
    .maybeSingle();
  const eerder = new Map(((laatste?.regels ?? []) as Regel[]).map((r) => [r.vraagId, r]));

  const regels = werkblad.vragen.map((v, i) => {
    const vraag = vindVraag(v.vraagId);
    const oud = eerder.get(v.vraagId);
    return {
      nummer: i + 1,
      vraagId: v.vraagId,
      opgave: vraag ? opgaveTekst(vraag) : "Onbekende vraag",
      antwoord: vraag && vraag.soort !== "europa" ? String(vraag.answer) : "",
      uitkomst: oud?.uitkomst ?? "onbekend",
      hulp: oud?.hulp ?? "onbekend",
    };
  });

  return (
    <>
      <div>
        <h1 className="titel-pagina">Papierresultaten</h1>
        <p className="mt-1 text-tekst-zacht">
          {werkblad.titel} · code {werkblad.code}
        </p>
      </div>
      <PapierFormulier
        key={kind.id}
        werkbladId={werkblad.id}
        kinderen={kinderen.map((k) => ({ id: k.id, voornaam: k.voornaam }))}
        kindId={kind.id}
        regels={regels}
        versie={laatste?.versie ?? 0}
        bewaardOp={laatste?.op ?? null}
      />
    </>
  );
}

