import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Icoon } from "@/components/mees/Icoon";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { formatLesDatum, formatLesTijd, kanMeedoen } from "@/features/live/regels";
import { lessenVoorKind } from "@/features/live/server";
import { haalHulpVanGezin } from "@/features/tutorhulp/server";
import { haalActiefKind } from "@/lib/server/dal";
import { StartScherm } from "./StartScherm";

export const metadata: Metadata = { title: "Start" };

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <LesMelding />
        <HulpMelding />
      </Suspense>
      <StartScherm />
    </>
  );
}

/** Live les: begonnen (doe mee) of een uitnodiging waarvoor de ouder toestemming gaf. */
async function LesMelding() {
  const kind = await haalActiefKind();
  if (!kind) return null;
  const lessen = (await lessenVoorKind(kind.id)).filter((l) => l.uitnodiging.status === "toegestaan" && (l.status === "gepland" || l.status === "live"));
  const live = lessen.find((l) => l.uitnodiging.kindAanmelding === "ja" && kanMeedoen(l.status, l.startOp, l.duurMin));
  const les = live ?? lessen.find((l) => l.uitnodiging.kindAanmelding !== "nee");
  if (!les) return null;
  return (
    <div className="mees-content pt-4 tablet:max-w-[1100px] tablet:pt-6">
      <Link
        href={live ? `/kind/lessen/${les.id}/live` : `/kind/lessen/${les.id}`}
        className={`flex items-center gap-4 rounded-[16px] p-4 hover:bg-blauw-zacht tablet:p-5 ${live ? "border-2 border-fout bg-wit" : "border-2 border-actie-blauw bg-wit"}`}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
          <Icoon naam="live" className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{live ? "De live les is begonnen. Doe mee!" : les.uitnodiging.kindAanmelding === "ja" ? "Je doet mee met een live les" : "Je bent uitgenodigd voor een live les"}</span>
          <span className="block tekst-klein text-tekst-zacht">
            {les.titel} · {formatLesDatum(les.startOp)} om {formatLesTijd(les.startOp)}
          </span>
        </span>
        <Icoon naam="chevron-rechts" className="size-6 text-actie-blauw" />
      </Link>
    </div>
  );
}

/** Uitleg van een tutor of een lopende hulpvraag: bovenaan, rustig, zonder badge-druk. */
async function HulpMelding() {
  const kind = await haalActiefKind();
  if (!kind) return null;
  const { hulpvragen } = await haalHulpVanGezin(kind.id);
  const klaar = hulpvragen.find((h) => h.status === "uitleg-verstuurd" && h.uitlegId);
  const loopt = hulpvragen.find((h) => h.status === "nieuw" || h.status === "in-behandeling");
  const h = klaar ?? loopt;
  if (!h) return null;
  return (
    <div className="mees-content pt-4 tablet:max-w-[1100px] tablet:pt-6">
      <Link
        href={klaar ? `/kind/uitleg/${klaar.uitlegId}` : `/kind/hulpvragen/${h.id}`}
        className={`flex items-center gap-4 rounded-[16px] p-4 hover:bg-blauw-zacht tablet:p-5 ${klaar ? "border-2 border-actie-blauw bg-wit" : "border border-rand-zacht bg-wit"}`}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
          <Icoon naam="tutor" className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{klaar ? "Je tutor heeft uitleg voor je" : "De tutor kijkt naar je hulpvraag"}</span>
          <span className="block tekst-klein text-tekst-zacht">{leerdoelNaam(h.leerdoelId)}</span>
        </span>
        <Icoon naam="chevron-rechts" className="size-6 text-actie-blauw" />
      </Link>
    </div>
  );
}
