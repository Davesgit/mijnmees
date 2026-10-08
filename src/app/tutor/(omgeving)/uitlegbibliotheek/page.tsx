import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { SecundaireKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { haalBibliotheek } from "@/features/tutorhulp/server";
import { relatieveDag } from "@/lib/server/voortgang";
import { vereisTutor } from "@/lib/server/rollen";
import { maakUitleg } from "../../acties";

export const metadata: Metadata = { title: "Uitlegbibliotheek" };

const leerdoelKeuzes = ["breuken-vergelijken", ...Array.from({ length: 12 }, (_, i) => `tafel-${i + 1}`), ...Array.from({ length: 12 }, (_, i) => `deeltafel-${i + 1}`)];

/** U10: uitleg per leerdoel. Eigen concepten en gepubliceerde uitleg. */
export default function BibliotheekPage({ searchParams }: PageProps<"/tutor/uitlegbibliotheek">) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10">
      <div>
        <h1 className="titel-held">Uitlegbibliotheek</h1>
        <p className="mt-1 subtitel font-semibold text-tekst-zacht">Uitleg per leerdoel</p>
      </div>
      <Suspense fallback={<Laden />}>
        <Inhoud searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ searchParams }: Pick<PageProps<"/tutor/uitlegbibliotheek">, "searchParams">) {
  const tutor = await vereisTutor("/tutor/uitlegbibliotheek");
  const [items, params] = await Promise.all([haalBibliotheek(tutor), searchParams]);
  const perLeerdoel = Map.groupBy(items, (i) => i.leerdoelId);
  return (
    <>
      {params.gepubliceerd && <Melding soort="succes">De uitleg staat in de bibliotheek.</Melding>}
      {params.fout && <Melding soort="fout">Dit lukte niet. Probeer het nog eens.</Melding>}
      <form action={maakUitleg} className="flex flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:flex-row tablet:items-end">
        <label className="flex flex-1 flex-col gap-2 font-bold">
          Nieuwe uitleg voor
          <select name="leerdoelId" className="min-h-12 rounded-[12px] border border-rand-interactief bg-wit px-3 font-normal">
            {leerdoelKeuzes.map((l) => (
              <option key={l} value={l}>
                {leerdoelNaam(l)}
              </option>
            ))}
          </select>
        </label>
        <SecundaireKnop type="submit">Maak uitleg</SecundaireKnop>
      </form>
      {items.length === 0 && <p className="rounded-[16px] border border-rand-zacht bg-wit p-6">Er is nog geen uitleg. Gepubliceerde uitleg kun je later opnieuw sturen bij een passende hulpvraag.</p>}
      {[...perLeerdoel].map(([leerdoel, lijst]) => (
        <section key={leerdoel} aria-labelledby={`l-${leerdoel}`}>
          <h2 id={`l-${leerdoel}`} className="subtitel">
            {leerdoelNaam(leerdoel)}
          </h2>
          <ul className="mt-2 divide-y divide-rand-zacht rounded-[16px] border border-rand-zacht bg-wit">
            {lijst.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span>
                  <span className="block font-bold">{u.titel}</span>
                  <span className="block tekst-klein text-tekst-zacht">
                    {u.status === "gepubliceerd" ? "Gepubliceerd" : "Concept"} · {u.vanMij ? "van jou" : "van een andere tutor"} · {relatieveDag(u.bijgewerktOp)}
                  </span>
                </span>
                {u.vanMij && (
                  <Link href={u.status === "concept" ? `/tutor/uitleg/${u.id}/bewerken` : `/tutor/uitleg/${u.id}/controle`} className="inline-flex min-h-12 items-center rounded-[12px] px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht">
                    {u.status === "concept" ? "Verder werken" : "Bekijk"}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
