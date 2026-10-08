import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { leerdoelNaam, leerdoelOefenRoute } from "@/features/oefenen/weergave";
import { tutorhulpMogelijk } from "@/features/tutorhulp/criteria";
import { geschiktheidVoorKind, haalHulpVanGezin } from "@/features/tutorhulp/server";
import { haalActiefKind } from "@/lib/server/dal";
import { LaatOuderWeten } from "./LaatOuderWeten";

export const metadata: Metadata = { title: "Extra uitleg" };

type Props = PageProps<"/kind/hulp/[doelId]">;

/** H01: extra uitleg kan helpen. Het kind laat de ouder weten; de ouder beslist. */
export default function HulpPage({ params }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-[900px] tablet:py-10">
      <TerugLink href="/kind/start">Start</TerugLink>
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} />
      </Suspense>
    </div>
  );
}

async function Inhoud({ params }: Pick<Props, "params">) {
  const { doelId } = await params;
  const leerdoelId = decodeURIComponent(doelId);
  const kind = await haalActiefKind();
  const tussenstap = `${leerdoelOefenRoute(leerdoelId)}${leerdoelOefenRoute(leerdoelId).includes("?") ? "&" : "?"}niveau=makkelijk`;

  const kop = (
    <div className="flex items-center justify-between gap-6">
      <div>
        <h1 className="titel-held">Extra uitleg kan helpen</h1>
        <p className="mt-2 subtitel font-semibold text-tekst-zacht">{leerdoelNaam(leerdoelId)}</p>
      </div>
      <Mees pose="helpt" breedte={180} className="hidden w-36 tablet:block" />
    </div>
  );

  if (!kind || !tutorhulpMogelijk(leerdoelId)) {
    return (
      <>
        {kop}
        <Melding>{kind ? "Voor dit onderdeel is nog geen tutor. Probeer een tussenstap." : "Met een ouderaccount kan je ouder meekijken en extra uitleg vragen."}</Melding>
        <SecundaireKnop href={tussenstap} className="self-start">
          Probeer een tussenstap
        </SecundaireKnop>
      </>
    );
  }

  const [{ meldingen, hulpvragen }, geschiktheid] = await Promise.all([haalHulpVanGezin(kind.id), geschiktheidVoorKind(kind.id, leerdoelId)]);
  const open = hulpvragen.find((h) => h.leerdoelId === leerdoelId && h.status !== "afgerond");
  if (open) {
    return (
      <>
        {kop}
        <Melding soort="succes">Er staat al een hulpvraag voor je klaar.</Melding>
        <PrimaireKnop href={`/kind/hulpvragen/${open.id}`} className="self-start">
          Bekijk je hulpvraag
          <Icoon naam="pijl-rechts" />
        </PrimaireKnop>
      </>
    );
  }
  const alGemeld = meldingen.some((m) => m.leerdoelId === leerdoelId);

  return (
    <>
      {kop}
      {geschiktheid?.geschikt ? (
        <>
          <ul className="flex flex-col gap-2 text-lg">
            <li className="flex items-start gap-3">
              <Icoon naam="check" className="mt-1 size-6 text-succes" />
              Je hebt de aanwijzingen en een soortgelijke vraag geprobeerd.
            </li>
            <li className="flex items-start gap-3">
              <Icoon naam="check" className="mt-1 size-6 text-succes" />
              Je ouder kan bekijken of hulp van een tutor past.
            </li>
          </ul>
          {alGemeld ? <Melding soort="succes">Je ouder weet het al. Je kunt ondertussen iets anders oefenen.</Melding> : <LaatOuderWeten leerdoelId={leerdoelId} />}
          <SecundaireKnop href={tussenstap} className="self-start">
            Probeer een tussenstap
          </SecundaireKnop>
        </>
      ) : (
        <>
          <p className="text-lg">Probeer eerst de uitleg en een tussenstap.</p>
          {geschiktheid && geschiktheid.ontbreekt.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 pl-6 text-tekst-zacht">
              {geschiktheid.ontbreekt.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          )}
          <PrimaireKnop href={tussenstap} className="self-start">
            Probeer een tussenstap
          </PrimaireKnop>
        </>
      )}
    </>
  );
}
