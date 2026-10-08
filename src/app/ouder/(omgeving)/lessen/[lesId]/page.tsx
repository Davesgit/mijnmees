import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { formatLesDatum, formatLesTijd } from "@/features/live/regels";
import { lesVoorKind } from "@/features/live/server";
import { haalEigenKind, haalKinderen, vereisOntgrendeldeOuder } from "@/lib/server/dal";
import { besluitOverLes } from "../../../les-acties";

export const metadata: Metadata = { title: "Uitnodiging live les" };

type Props = PageProps<"/ouder/lessen/[lesId]">;

/** L03: ouder beslist per les. Niet deelnemen heeft geen gevolgen voor het oefenen. */
export default function OuderLesPage({ params, searchParams }: Props) {
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
  const [{ lesId }, sp] = await Promise.all([params, searchParams]);
  await vereisOntgrendeldeOuder(`/ouder/lessen/${lesId}`);
  const kinderen = await haalKinderen();
  const kandidaten = typeof sp.kind === "string" && sp.kind ? [await haalEigenKind(sp.kind)] : kinderen;
  let gevonden: { kind: NonNullable<Awaited<ReturnType<typeof haalEigenKind>>>; les: NonNullable<Awaited<ReturnType<typeof lesVoorKind>>> } | null = null;
  for (const k of kandidaten) {
    if (!k) continue;
    const les = await lesVoorKind(k.id, lesId);
    if (les) {
      gevonden = { kind: k, les };
      break;
    }
  }
  if (!gevonden) notFound();
  const { kind, les } = gevonden;
  const besloten = les.uitnodiging.status !== "uitgenodigd";

  return (
    <>
      <div>
        <h1 className="titel-held">Een les voor {kind.voornaam}</h1>
        <p className="mt-2 subtitel font-semibold text-tekst-zacht">{leerdoelNaam(les.leerdoelId)}</p>
      </div>
      {sp.bewaard && <Melding soort="succes">Je keuze is bewaard.</Melding>}
      <section className="flex flex-col gap-2 rounded-[16px] border border-rand-zacht bg-wit p-5">
        <p className="text-lg font-bold">{les.titel}</p>
        <p className="flex items-center gap-2">
          <Icoon naam="tijd" className="size-5 text-actie-blauw" />
          {formatLesDatum(les.startOp)} om {formatLesTijd(les.startOp)} · {les.duurMin} minuten · tutor {les.tutorVoornaam}
        </p>
      </section>
      <ul className="flex flex-col gap-2 text-lg">
        {["Kinderen zien elkaar niet. Hun microfoon en camera blijven uit.", "Vragen gaan privé naar de tutor. Andere kinderen zien ze niet.", les.opnemen ? "De opname bevat alleen de stem van de tutor en het bord. Na controle kunnen uitgenodigde kinderen hem terugkijken." : "Deze les wordt niet opgenomen."].map((t) => (
          <li key={t} className="flex items-start gap-3">
            <Icoon naam="check" className="mt-1 size-5 shrink-0 text-succes" />
            {t}
          </li>
        ))}
      </ul>
      {les.status === "geannuleerd" || les.status === "afgelopen" ? (
        <Melding>Deze les is {les.status === "geannuleerd" ? "geannuleerd" : "voorbij"}.</Melding>
      ) : (
        <>
          {besloten && <Melding>{les.uitnodiging.status === "toegestaan" ? `${kind.voornaam} mag meedoen.` : `${kind.voornaam} doet niet mee.`} Je kunt je keuze hieronder aanpassen.</Melding>}
          <div className="flex flex-col gap-3 tablet:flex-row">
            <form action={besluitOverLes}>
              <input type="hidden" name="lesId" value={les.id} />
              <input type="hidden" name="kindId" value={kind.id} />
              <input type="hidden" name="besluit" value="toestaan" />
              <PrimaireKnop type="submit" groot className="w-full" disabled={les.uitnodiging.status === "toegestaan"}>
                Deelname toestaan
              </PrimaireKnop>
            </form>
            <form action={besluitOverLes}>
              <input type="hidden" name="lesId" value={les.id} />
              <input type="hidden" name="kindId" value={kind.id} />
              <input type="hidden" name="besluit" value="weigeren" />
              <SecundaireKnop type="submit" groot className="w-full" disabled={les.uitnodiging.status === "geweigerd"}>
                Niet deelnemen
              </SecundaireKnop>
            </form>
          </div>
          <p className="tekst-klein text-tekst-zacht">Niet deelnemen heeft geen gevolgen voor het oefenen in Mees.</p>
        </>
      )}
    </>
  );
}
