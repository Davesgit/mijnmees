import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { TekstKnop } from "@/components/mees/Knoppen";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { tutorhulpMogelijk } from "@/features/tutorhulp/criteria";
import { geschiktheidVoorKind, haalHulpVanGezin, type HulpvraagStatus } from "@/features/tutorhulp/server";
import { haalEigenKind, haalKinderen, vereisOntgrendeldeOuder } from "@/lib/server/dal";
import { formatDatum } from "@/lib/server/voortgang";
import { createClient } from "@/lib/supabase/server";
import { sluitMelding } from "../../../hulp-acties";
import { StuurFormulier } from "./StuurFormulier";

export const metadata: Metadata = { title: "Extra uitleg" };

type Props = PageProps<"/ouder/hulp/[doelId]">;

const statusTekst: Record<HulpvraagStatus, string> = {
  nieuw: "De hulpvraag is verstuurd. Een tutor pakt hem op; er is geen vaste antwoordtijd.",
  "in-behandeling": "Een tutor maakt een persoonlijke uitleg.",
  "uitleg-verstuurd": "De uitleg staat klaar in Mees, met een nieuwe controlevraag.",
  afgerond: "Deze hulpvraag is afgerond.",
};

/** O03: wat is al geprobeerd, en past een tutor? De ouder beslist. */
export default function OuderHulpPage({ params, searchParams }: Props) {
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
  const [{ doelId }, sp] = await Promise.all([params, searchParams]);
  const leerdoelId = decodeURIComponent(doelId);
  await vereisOntgrendeldeOuder(`/ouder/hulp/${doelId}`);
  const kinderen = await haalKinderen();
  const kind = (typeof sp.kind === "string" ? await haalEigenKind(sp.kind) : null) ?? kinderen[0];
  if (!kind || !tutorhulpMogelijk(leerdoelId)) notFound();

  const supabase = await createClient();
  const [{ hulpvragen }, geschiktheid, { data: instelling }] = await Promise.all([
    haalHulpVanGezin(kind.id),
    geschiktheidVoorKind(kind.id, leerdoelId),
    supabase.from("kinderen").select("tutorhulp_toegestaan").eq("id", kind.id).single(),
  ]);
  const vragen = hulpvragen.filter((h) => h.leerdoelId === leerdoelId);
  const open = vragen.find((h) => h.status !== "afgerond");
  const bewijs = open?.bewijs ?? geschiktheid?.bewijs;
  const stappen = [
    { tekst: "Hint 1", gedaan: Boolean(bewijs?.vastgelopen.length) },
    { tekst: "Hint 2", gedaan: Boolean(bewijs?.vastgelopen.length) },
    { tekst: "Uitleg van Mees", gedaan: (bewijs?.dagen.length ?? 0) > 0 },
    { tekst: "Soortgelijke vraag", gedaan: (bewijs?.vervolgNietZelfstandig ?? 0) > 0 },
  ];

  return (
    <>
      <div>
        <h1 className="titel-held">Extra uitleg voor {kind.voornaam}</h1>
        <p className="mt-2 subtitel font-semibold text-tekst-zacht">{leerdoelNaam(leerdoelId)} · bekijk wat al is geprobeerd</p>
      </div>
      {sp.verstuurd && <Melding soort="succes">De hulpvraag is naar een tutor gestuurd.</Melding>}

      <section className="rounded-[16px] border border-rand-zacht bg-wit p-5">
        <h2 className="font-bold">Al geprobeerd</h2>
        <ul className="mt-3 grid gap-2 min-[480px]:grid-cols-2">
          {stappen.map((s) => (
            <li key={s.tekst} className="flex items-center gap-2">
              <Icoon naam={s.gedaan ? "check" : "fout"} className={`size-5 ${s.gedaan ? "text-succes" : "text-tekst-zacht"}`} />
              {s.tekst}
            </li>
          ))}
        </ul>
        {bewijs && bewijs.dagen.length > 0 && <p className="mt-3 tekst-klein text-tekst-zacht">Vastgelopen op: {bewijs.dagen.map((d) => formatDatum(`${d}T12:00:00Z`)).join(", ")}.</p>}
        <p className="mt-2 tekst-klein text-tekst-zacht">Een tussenstap (een makkelijker basisonderdeel) is nog niet beschikbaar in Mees.</p>
      </section>

      <Melding>Een tutor ziet alleen de voornaam, de groep en de oefencontext. Geen e-mailadres of andere gegevens.</Melding>

      {open ? (
        <section className="flex flex-col gap-2 rounded-[16px] border-2 border-actie-blauw bg-wit p-5">
          <h2 className="font-bold">Hulpvraag van {formatDatum(open.aangemaaktOp)}</h2>
          <p>{statusTekst[open.status]}</p>
          <p className="tekst-klein text-tekst-zacht">Er komt geen tweede aanvraag zolang deze loopt.</p>
        </section>
      ) : geschiktheid?.geschikt ? (
        <>
          {!instelling?.tutorhulp_toegestaan && (
            <Melding soort="probeer-opnieuw">
              Tutorhulp staat uit voor {kind.voornaam}.{" "}
              <Link href="/ouder/instellingen" className="font-bold underline underline-offset-4">
                Zet het aan bij Instellingen
              </Link>
            </Melding>
          )}
          <StuurFormulier kindId={kind.id} leerdoelId={leerdoelId} toegestaan={Boolean(instelling?.tutorhulp_toegestaan)} />
          <form action={sluitMelding}>
            <input type="hidden" name="kindId" value={kind.id} />
            <input type="hidden" name="leerdoelId" value={leerdoelId} />
            <TekstKnop type="submit">Probeer eerst een tussenstap (melding sluiten)</TekstKnop>
          </form>
        </>
      ) : (
        <Melding>
          Een tutor is nu nog niet passend. {geschiktheid?.ontbreekt.join(" ")}
        </Melding>
      )}

      {vragen.filter((h) => h.status === "afgerond").length > 0 && (
        <section className="rounded-[16px] border border-rand-zacht bg-wit p-5">
          <h2 className="font-bold">Eerdere hulpvragen</h2>
          <ul className="mt-2 flex flex-col gap-1 tekst-klein">
            {vragen
              .filter((h) => h.status === "afgerond")
              .map((h) => (
                <li key={h.id}>
                  {formatDatum(h.aangemaaktOp)}: {h.afsluitreden ?? "Afgerond"}
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  );
}
