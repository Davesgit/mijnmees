import Link from "next/link";
import { Icoon } from "@/components/mees/Icoon";
import { relatieveDag } from "@/lib/server/voortgang";
import { haalEigenWerkbladen, haalPapierSamenvattingen } from "./server";

/** O01/O02: de laatste werkbladen met antwoordblad en papierresultaten. */
export async function WerkbladenKaart({ kindId, voornaam }: { kindId: string; voornaam: string }) {
  const [werkbladen, papier] = await Promise.all([haalEigenWerkbladen(6), haalPapierSamenvattingen(kindId)]);
  return (
    <section className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="subtitel">Werkbladen en papierwerk</h2>
        <Link href="/werkbladen/samenstellen" className="inline-flex min-h-12 items-center gap-1 rounded-[12px] px-2 font-bold text-actie-blauw hover:bg-blauw-zacht">
          <Icoon naam="plus" className="size-5" />
          Nieuw werkblad
        </Link>
      </div>
      {werkbladen.length === 0 ? (
        <p className="text-tekst-zacht">Nog geen werkbladen. Maak er een om op papier te oefenen; het antwoordblad vind je daarna hier.</p>
      ) : (
        <ul className="divide-y divide-rand-zacht">
          {werkbladen.map((w) => {
            const p = papier.get(w.id);
            return (
              <li key={w.id} className="flex flex-col gap-2 py-3 tablet:flex-row tablet:items-center tablet:gap-4">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
                    <Icoon naam="werkblad" className="size-6" />
                  </span>
                  <span className="min-w-0">
                    <Link href={`/werkbladen/${w.id}`} className="block font-bold hover:text-actie-blauw">
                      {w.titel.replace(/^Rekenen · /, "")}
                    </Link>
                    <span className="block tekst-klein text-tekst-zacht">
                      {relatieveDag(w.aangemaaktOp)} · {w.code} ·{" "}
                      {p ? `${voornaam}: ${p.goed} van ${p.totaal} goed${p.nagekeken < p.totaal ? ` (${p.totaal - p.nagekeken} niet nagekeken)` : ""}` : "nog niet ingevuld"}
                    </span>
                  </span>
                </span>
                <span className="flex gap-2 pl-14 tablet:pl-0">
                  <Link href={`/ouder/werkbladen/${w.id}/antwoorden`} className="inline-flex min-h-12 items-center rounded-[12px] border border-rand-interactief px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht">
                    Antwoordblad
                  </Link>
                  <Link href={`/ouder/werkbladen/${w.id}/resultaten?kind=${kindId}`} className="inline-flex min-h-12 items-center rounded-[12px] border border-rand-interactief px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht">
                    {p ? "Resultaten" : "Vul in"}
                  </Link>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 tekst-klein text-tekst-zacht">Papierwerk telt apart. Het verandert niets aan wat Mees uit het digitale oefenen afleidt.</p>
    </section>
  );
}
