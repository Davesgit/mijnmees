import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { haalWerkvoorraad, type HulpvraagStatus } from "@/features/tutorhulp/server";
import { relatieveDag } from "@/lib/server/voortgang";
import { vereisTutor } from "@/lib/server/rollen";
import { pakOp } from "../../acties";

export const metadata: Metadata = { title: "Hulpvragen" };

const statusNaam: Record<HulpvraagStatus, string> = {
  nieuw: "Nieuw",
  "in-behandeling": "In behandeling",
  "uitleg-verstuurd": "Wacht op controlevraag",
  afgerond: "Afgerond",
};

/** U02: werkvoorraad. Nieuwe vragen zonder naam; oppakken is atomair. */
export default function HulpvragenPage({ searchParams }: PageProps<"/tutor/hulpvragen">) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10">
      <div>
        <h1 className="titel-held">Hulpvragen</h1>
        <p className="mt-1 subtitel font-semibold text-tekst-zacht">Pak een vraag op waar je bij kunt helpen.</p>
      </div>
      <Suspense fallback={<Laden />}>
        <Inhoud searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ searchParams }: Pick<PageProps<"/tutor/hulpvragen">, "searchParams">) {
  const tutor = await vereisTutor("/tutor/hulpvragen");
  const [werk, params] = await Promise.all([haalWerkvoorraad(tutor), searchParams]);
  const filter = typeof params.filter === "string" ? params.filter : "alles";
  const groepen: { titel: string; items: typeof werk }[] = [
    { titel: "Nieuw", items: werk.filter((w) => !w.vanMij && w.status !== "afgerond") },
    { titel: "Mijn hulpvragen", items: werk.filter((w) => w.vanMij && w.status === "in-behandeling") },
    { titel: "Wacht op controlevraag", items: werk.filter((w) => w.vanMij && w.status === "uitleg-verstuurd") },
    { titel: "Afgerond", items: werk.filter((w) => w.vanMij && w.status === "afgerond") },
  ];
  const leerdoelen = [...new Set(werk.map((w) => w.leerdoelId))];
  const zichtbaar = (items: typeof werk) => (filter === "alles" ? items : items.filter((w) => w.leerdoelId === filter));

  return (
    <>
      {params.bezet && <Melding soort="probeer-opnieuw">Een andere tutor heeft deze hulpvraag net opgepakt.</Melding>}
      {params.afgerond && <Melding soort="succes">De hulpvraag is afgerond.</Melding>}
      {leerdoelen.length > 1 && (
        <nav aria-label="Filter op onderdeel" className="flex flex-wrap gap-2">
          {["alles", ...leerdoelen].map((l) => (
            <Link
              key={l}
              href={l === "alles" ? "/tutor/hulpvragen" : `/tutor/hulpvragen?filter=${encodeURIComponent(l)}`}
              aria-current={filter === l ? "true" : undefined}
              className={`inline-flex min-h-12 items-center rounded-full border px-4 font-semibold ${filter === l ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-rand-interactief bg-wit hover:bg-blauw-zacht"}`}
            >
              {l === "alles" ? "Alles" : leerdoelNaam(l)}
            </Link>
          ))}
        </nav>
      )}
      {werk.length === 0 && <p className="rounded-[16px] border border-rand-zacht bg-wit p-6 text-lg">Er staan geen passende hulpvragen open.</p>}
      {groepen.map((g) => {
        const items = zichtbaar(g.items);
        if (items.length === 0) return null;
        return (
          <section key={g.titel} aria-labelledby={`groep-${g.titel}`}>
            <h2 id={`groep-${g.titel}`} className="subtitel">
              {g.titel} <span className="text-tekst-zacht">({items.length})</span>
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {items.map((w) => (
                <li key={w.id} className="flex flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                  <div>
                    <p className="font-bold">{leerdoelNaam(w.leerdoelId)}</p>
                    <p className="tekst-klein text-tekst-zacht">
                      Groep {w.groep} · {statusNaam[w.status]} · aangevraagd {relatieveDag(w.aangemaaktOp)} · vastgelopen op {w.dagen} dagen
                    </p>
                  </div>
                  {w.vanMij ? (
                    <PrimaireKnop href={w.status === "uitleg-verstuurd" || w.status === "afgerond" ? `/tutor/hulpvragen/${w.id}/resultaat` : `/tutor/hulpvragen/${w.id}`}>Open</PrimaireKnop>
                  ) : (
                    <form action={pakOp}>
                      <input type="hidden" name="hulpvraagId" value={w.id} />
                      <PrimaireKnop type="submit">Oppakken</PrimaireKnop>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
