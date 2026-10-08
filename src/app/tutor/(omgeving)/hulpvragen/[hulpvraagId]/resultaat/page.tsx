import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { SecundaireKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { haalDossier } from "@/features/tutorhulp/server";
import { formatDatum } from "@/lib/server/voortgang";
import { vereisTutor } from "@/lib/server/rollen";
import { vervolgHulpvraag } from "../../../../acties";
import { AfrondFormulier } from "./AfrondFormulier";

export const metadata: Metadata = { title: "Na de uitleg" };

type Props = PageProps<"/tutor/hulpvragen/[hulpvraagId]/resultaat">;

const controleTekst = {
  zelfstandig: { tekst: "Zelfstandig gelukt", kleur: "bg-succes-zacht text-succes", icoon: "check" },
  "met-hulp": { tekst: "Gelukt met een hint", kleur: "bg-probeer-opnieuw-zacht text-probeer-opnieuw", icoon: "hint" },
  "met-uitleg": { tekst: "Nog hulp nodig (uitleg van Mees gebruikt)", kleur: "bg-probeer-opnieuw-zacht text-probeer-opnieuw", icoon: "hint" },
} as const;

/** U06: kijk wat zelfstandig lukt na de uitleg. Afronden alleen met een reden. */
export default function ResultaatPage({ params, searchParams }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10">
      <TerugLink href="/tutor/hulpvragen">Hulpvragen</TerugLink>
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { hulpvraagId } = await params;
  const tutor = await vereisTutor(`/tutor/hulpvragen/${hulpvraagId}/resultaat`);
  const dossier = await haalDossier(tutor, hulpvraagId);
  if (!dossier) notFound();
  const { hulpvraag, kind, controle } = dossier;
  const { verstuurd } = await searchParams;
  const c = controle ? controleTekst[controle] : null;

  return (
    <>
      <div>
        <h1 className="titel-held">Na de uitleg</h1>
        <p className="mt-1 subtitel font-semibold text-tekst-zacht">
          {kind.voornaam} · {leerdoelNaam(hulpvraag.leerdoelId)}
        </p>
      </div>
      {verstuurd && <Melding soort="succes">Je uitleg is verstuurd. {kind.voornaam} ziet hem bij de volgende keer in Mees.</Melding>}

      <section className="flex flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-5">
        <h2 className="subtitel">Controlevraag</h2>
        {dossier.controleOpgave ? <p className="text-2xl font-bold tabular-nums">{dossier.controleOpgave}</p> : <p className="text-tekst-zacht">Er was geen nieuwe vraag beschikbaar.</p>}
        {c ? (
          <p className={`flex items-center gap-2 self-start rounded-[12px] px-4 py-3 font-bold ${c.kleur}`}>
            <Icoon naam={c.icoon} />
            {c.tekst}
          </p>
        ) : (
          <p className="self-start rounded-[12px] bg-achtergrond-zacht px-4 py-3 font-semibold">Nog niet gecontroleerd. {kind.voornaam} heeft de controlevraag nog niet gemaakt.</p>
        )}
        {dossier.uitleg && (
          <p className="tekst-klein text-tekst-zacht">
            Verstuurde uitleg: {dossier.uitleg.titel}
            {" · "}
            <a className="font-semibold text-actie-blauw underline" href={`/tutor/uitleg/${dossier.uitleg.id}/controle`}>
              Bekijk
            </a>
          </p>
        )}
      </section>

      {hulpvraag.status === "afgerond" ? (
        <Melding>
          Afgerond op {hulpvraag.afgerondOp ? formatDatum(hulpvraag.afgerondOp) : "onbekend"}. {hulpvraag.afsluitreden}
        </Melding>
      ) : (
        <div className="grid gap-4 desktop:grid-cols-2">
          <AfrondFormulier hulpvraagId={hulpvraag.id} controle={controle} />
          <section className="flex flex-col items-start gap-3 rounded-[16px] border border-rand-zacht bg-wit p-5">
            <h2 className="font-bold">Is meer uitleg nodig?</h2>
            <p className="text-tekst-zacht">Maak een vervolg in hetzelfde dossier. Er komt geen tweede aanvraag.</p>
            <form action={vervolgHulpvraag}>
              <input type="hidden" name="hulpvraagId" value={hulpvraag.id} />
              <SecundaireKnop type="submit">Vervolg hulpvraag</SecundaireKnop>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
