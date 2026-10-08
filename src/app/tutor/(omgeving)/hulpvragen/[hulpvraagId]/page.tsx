import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop, TekstKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { haalBibliotheek, haalDossier } from "@/features/tutorhulp/server";
import { formatDatum, formatTijd } from "@/lib/server/voortgang";
import { vereisTutor } from "@/lib/server/rollen";
import { geefTerug, koppelUitleg, maakUitleg } from "../../../acties";

export const metadata: Metadata = { title: "Hulpvraag" };

type Props = PageProps<"/tutor/hulpvragen/[hulpvraagId]">;

/** U03: dossier met alleen voornaam, groep en oefencontext. */
export default function HulpvraagPage({ params, searchParams }: Props) {
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
  const tutor = await vereisTutor(`/tutor/hulpvragen/${hulpvraagId}`);
  const dossier = await haalDossier(tutor, hulpvraagId);
  if (!dossier) notFound();
  const { hulpvraag, kind, pogingen } = dossier;
  if (hulpvraag.status === "uitleg-verstuurd" || hulpvraag.status === "afgerond") redirect(`/tutor/hulpvragen/${hulpvraag.id}/resultaat`);
  const { fout } = await searchParams;
  const passend = (await haalBibliotheek(tutor)).filter((u) => u.status === "gepubliceerd" && u.leerdoelId === hulpvraag.leerdoelId);
  const metHulp = pogingen.filter((p) => p.hints > 0 || p.uitleg);

  return (
    <>
      <div>
        <h1 className="titel-held">Hulpvraag van {kind.voornaam}</h1>
        <p className="mt-1 subtitel font-semibold text-tekst-zacht">
          {leerdoelNaam(hulpvraag.leerdoelId)} · groep {kind.groep}
        </p>
      </div>
      {fout && <Melding soort="fout">Dit lukte niet. Probeer het nog eens.</Melding>}

      <div className="grid gap-4 desktop:grid-cols-3">
        <section className="rounded-[16px] border border-rand-zacht bg-wit p-5">
          <h2 className="font-bold">Wat is gedaan</h2>
          <ul className="mt-2 flex flex-col gap-1">
            <li>Vastgelopen op {hulpvraag.bewijs.dagen.length} verschillende dagen</li>
            <li>{pogingen.length} antwoorden op dit onderdeel</li>
            <li>{hulpvraag.bewijs.vervolgNietZelfstandig}× een soortgelijke vraag niet zelfstandig</li>
          </ul>
        </section>
        <section className="rounded-[16px] border border-rand-zacht bg-wit p-5">
          <h2 className="font-bold">Welke hulp is gebruikt</h2>
          <ul className="mt-2 flex flex-col gap-1">
            <li>Hints: {metHulp.filter((p) => p.hints > 0).length}×</li>
            <li>Uitleg van Mees: {metHulp.filter((p) => p.uitleg).length}×</li>
            <li>Tussenstap: nog niet beschikbaar in Mees</li>
          </ul>
        </section>
        <section className="rounded-[16px] border border-rand-zacht bg-blauw-zacht p-5">
          <h2 className="font-bold">Na je uitleg</h2>
          <p className="mt-2">Mees kiest een nieuwe, soortgelijke controlevraag die {kind.voornaam} nog niet heeft gemaakt. Jij ziet daarna of het zelfstandig lukt.</p>
        </section>
      </div>

      <section aria-labelledby="antwoorden" className="rounded-[16px] border border-rand-zacht bg-wit p-5">
        <h2 id="antwoorden" className="subtitel">
          Antwoorden
        </h2>
        <p className="mt-1 tekst-klein text-tekst-zacht">Conclusies zijn gebaseerd op antwoorden, niet op veronderstelde denkfouten.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left">
            <thead className="tekst-klein text-tekst-zacht">
              <tr>
                <th className="py-2 pr-3 font-semibold">Wanneer</th>
                <th className="py-2 pr-3 font-semibold">Opgave</th>
                <th className="py-2 pr-3 font-semibold">Antwoord</th>
                <th className="py-2 pr-3 font-semibold">Goed antwoord</th>
                <th className="py-2 font-semibold">Hulp vooraf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rand-zacht">
              {[...pogingen].reverse().map((p, i) => (
                <tr key={i}>
                  <td className="py-2 pr-3 tekst-klein text-tekst-zacht">
                    {formatDatum(p.op)} {formatTijd(p.op)}
                  </td>
                  <td className="py-2 pr-3 font-semibold tabular-nums">
                    {p.opgave}
                    {p.vervolg && <span className="ml-2 rounded-full bg-blauw-zacht px-2 text-sm font-normal">soortgelijk</span>}
                  </td>
                  <td className={`py-2 pr-3 font-semibold ${p.resultaat === "goed" ? "text-succes" : "text-fout"}`}>
                    {p.antwoord} <span className="sr-only">({p.resultaat})</span>
                    <Icoon naam={p.resultaat === "goed" ? "check" : "fout"} className="ml-1 inline size-4" />
                  </td>
                  <td className="py-2 pr-3">{p.goedAntwoord}</td>
                  <td className="py-2 tekst-klein">{p.uitleg ? "Uitleg" : p.hints ? `${p.hints} hint${p.hints > 1 ? "s" : ""}` : "Geen"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col gap-3 tablet:flex-row tablet:flex-wrap">
        {dossier.uitleg?.status === "concept" ? (
          <PrimaireKnop href={`/tutor/uitleg/${dossier.uitleg.id}/bewerken`}>
            Ga verder met je uitleg
            <Icoon naam="pijl-rechts" />
          </PrimaireKnop>
        ) : (
          <form action={maakUitleg}>
            <input type="hidden" name="hulpvraagId" value={hulpvraag.id} />
            <PrimaireKnop type="submit" className="w-full">
              Maak uitleg
              <Icoon naam="pijl-rechts" />
            </PrimaireKnop>
          </form>
        )}
        <form action={geefTerug}>
          <input type="hidden" name="hulpvraagId" value={hulpvraag.id} />
          <TekstKnop type="submit">Geef terug aan de werkvoorraad</TekstKnop>
        </form>
      </div>

      {passend.length > 0 && (
        <section aria-labelledby="bestaand" className="rounded-[16px] border border-rand-zacht bg-wit p-5">
          <h2 id="bestaand" className="font-bold">
            Gebruik bestaande uitleg
          </h2>
          <p className="tekst-klein text-tekst-zacht">Alleen gecontroleerde uitleg voor {leerdoelNaam(hulpvraag.leerdoelId)}.</p>
          <ul className="mt-2 divide-y divide-rand-zacht">
            {passend.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{u.titel}</span>
                <form action={koppelUitleg}>
                  <input type="hidden" name="hulpvraagId" value={hulpvraag.id} />
                  <input type="hidden" name="uitlegId" value={u.id} />
                  <SecundaireKnop type="submit">Stuur deze uitleg</SecundaireKnop>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
