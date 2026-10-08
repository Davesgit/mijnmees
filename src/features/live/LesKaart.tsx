import Link from "next/link";
import { Icoon } from "@/components/mees/Icoon";
import { formatLesDatum, formatLesTijd } from "./regels";
import { lessenVoorKind } from "./server";

/** O01: uitnodigingen voor live-lessen. Toont niets als er niets is. */
export async function LesKaart({ kindId, voornaam }: { kindId: string; voornaam: string }) {
  const lessen = (await lessenVoorKind(kindId)).filter((l) => l.status === "gepland" || l.status === "live");
  if (lessen.length === 0) return null;
  return (
    <section aria-labelledby="lessen-kop" className="rounded-[16px] border-2 border-actie-blauw bg-wit p-5 tablet:p-6">
      <h2 id="lessen-kop" className="subtitel">
        Uitnodiging voor een live les
      </h2>
      <ul className="mt-3 divide-y divide-rand-zacht">
        {lessen.map((l) => (
          <li key={l.id}>
            <Link href={`/ouder/lessen/${l.id}?kind=${kindId}`} className="flex min-h-14 items-center gap-3 py-2 hover:text-actie-blauw">
              <Icoon naam="live" className="size-6 shrink-0 text-actie-blauw" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{l.titel}</span>
                <span className="block tekst-klein text-tekst-zacht">
                  {formatLesDatum(l.startOp)} om {formatLesTijd(l.startOp)} ·{" "}
                  {l.uitnodiging.status === "uitgenodigd" ? `Mag ${voornaam} meedoen?` : l.uitnodiging.status === "toegestaan" ? "Toegestaan" : "Niet deelnemen"}
                </span>
              </span>
              <Icoon naam="chevron-rechts" className="size-5 text-actie-blauw" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
