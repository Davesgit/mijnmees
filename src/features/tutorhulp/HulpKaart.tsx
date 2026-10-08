import Link from "next/link";
import { Icoon } from "@/components/mees/Icoon";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { relatieveDag } from "@/lib/server/voortgang";
import { haalHulpVanGezin, recenteHulpvragen, type HulpvraagStatus } from "./server";

const statusTekst: Record<HulpvraagStatus, string> = {
  nieuw: "Verstuurd, wacht op een tutor",
  "in-behandeling": "Een tutor maakt een uitleg",
  "uitleg-verstuurd": "Uitleg staat klaar",
  afgerond: "Afgerond",
};

/** O01: meldingen van het kind en lopende hulpvragen. Toont niets als er niets is. */
export async function HulpKaart({ kindId, voornaam }: { kindId: string; voornaam: string }) {
  const { meldingen, hulpvragen } = await haalHulpVanGezin(kindId);
  const recent = recenteHulpvragen(hulpvragen);
  if (meldingen.length === 0 && recent.length === 0) return null;
  return (
    <section aria-labelledby="hulp-kop" className="rounded-[16px] border-2 border-actie-blauw bg-wit p-5 tablet:p-6">
      <h2 id="hulp-kop" className="subtitel">
        Extra uitleg
      </h2>
      <ul className="mt-3 divide-y divide-rand-zacht">
        {meldingen.map((m) => (
          <li key={m.id}>
            <Link href={`/ouder/hulp/${encodeURIComponent(m.leerdoelId)}?kind=${kindId}`} className="flex min-h-14 items-center gap-3 py-2 hover:text-actie-blauw">
              <Icoon naam="tutor" className="size-6 shrink-0 text-actie-blauw" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">
                  {voornaam} laat weten dat extra uitleg kan helpen
                </span>
                <span className="block tekst-klein text-tekst-zacht">
                  {leerdoelNaam(m.leerdoelId)} · {relatieveDag(m.aangemaaktOp)}
                </span>
              </span>
              <Icoon naam="chevron-rechts" className="size-5 text-actie-blauw" />
            </Link>
          </li>
        ))}
        {recent.map((h) => (
          <li key={h.id}>
            <Link href={`/ouder/hulp/${encodeURIComponent(h.leerdoelId)}?kind=${kindId}`} className="flex min-h-14 items-center gap-3 py-2 hover:text-actie-blauw">
              <Icoon naam={h.status === "afgerond" ? "check" : "tutor"} className="size-6 shrink-0 text-actie-blauw" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{leerdoelNaam(h.leerdoelId)}</span>
                <span className="block tekst-klein text-tekst-zacht">{statusTekst[h.status]}</span>
              </span>
              <Icoon naam="chevron-rechts" className="size-5 text-actie-blauw" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
