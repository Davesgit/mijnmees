import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import type { Poging, Sessie, Slot } from "@/features/oefenen/types";
import { antwoordTekst, opgaveTekst, vindVraag } from "@/features/oefenen/vragen";
import { sessieNaam } from "@/features/oefenen/weergave";
import { WerkbladenKaart } from "@/features/werkbladen/WerkbladenKaart";
import { haalEigenKind, vereisOntgrendeldeOuder } from "@/lib/server/dal";
import { formatDatum, formatTijd, haalVoortgang, relatieveDag } from "@/lib/server/voortgang";

export const metadata: Metadata = { title: "Voortgang" };

type Props = PageProps<"/ouder/kind/[kindId]/voortgang">;

export default function VoortgangPage({ params, searchParams }: Props) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10">
      <TerugLink href="/ouder">Terug naar het overzicht</TerugLink>
      <Suspense fallback={<Laden />}>
        <Inhoud params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const uitkomstTekst: Record<NonNullable<Slot["uitkomst"]>, { tekst: string; kleur: string; icoon: AlleIcoonNamen }> = {
  zelfstandig: { tekst: "Zelfstandig", kleur: "text-succes", icoon: "check" },
  "met-hulp": { tekst: "Met hulp", kleur: "text-probeer-opnieuw", icoon: "hint" },
  "met-uitleg": { tekst: "Met uitleg", kleur: "text-probeer-opnieuw", icoon: "hint" },
};

async function Inhoud({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { kindId } = await params;
  await vereisOntgrendeldeOuder(`/ouder/kind/${kindId}/voortgang`);
  const kind = await haalEigenKind(kindId);
  if (!kind) notFound();
  const voortgang = await haalVoortgang(kind.id);
  const sessies = Object.values(voortgang?.sessies ?? {}).sort((a, b) => b.gestartOp.localeCompare(a.gestartOp));
  const { sessie: gekozenId } = await searchParams;
  const gekozen = sessies.find((s) => s.id === gekozenId) ?? sessies[0];

  return (
    <>
      <h1 className="titel-held">Voortgang van {kind.voornaam}</h1>
      {sessies.length === 0 ? (
        <p className="rounded-[16px] border border-rand-zacht bg-wit p-6 text-lg">Er zijn nog geen resultaten. Zodra {kind.voornaam} oefent, staan ze hier.</p>
      ) : (
        <div className="grid items-start gap-6 desktop:grid-cols-[18rem_1fr]">
          <nav aria-label="Oefensessies" className="rounded-[16px] border border-rand-zacht bg-wit p-2">
            <ul className="flex flex-col">
              {sessies.slice(0, 30).map((s) => {
                const actief = s.id === gekozen.id;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/ouder/kind/${kind.id}/voortgang?sessie=${s.id}`}
                      aria-current={actief ? "true" : undefined}
                      className={`flex min-h-14 flex-col justify-center rounded-[12px] px-3 py-2 ${actief ? "bg-blauw-zacht" : "hover:bg-achtergrond-zacht"}`}
                    >
                      <span className="font-bold">{sessieNaam(s)}</span>
                      <span className="tekst-klein text-tekst-zacht">
                        {relatieveDag(s.gestartOp)} · {s.status === "afgerond" ? "afgerond" : "nog bezig"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <SessieDetail sessie={gekozen} pogingen={(voortgang?.pogingen ?? []).filter((p) => p.sessieId === gekozen.id)} />
        </div>
      )}
      <WerkbladenKaart kindId={kind.id} voornaam={kind.voornaam} />
    </>
  );
}

function SessieDetail({ sessie, pogingen }: { sessie: Sessie; pogingen: Poging[] }) {
  const zelfstandig = sessie.slots.filter((s) => s.uitkomst === "zelfstandig").length;
  const ondersteund = sessie.slots.filter((s) => s.uitkomst && s.uitkomst !== "zelfstandig").length;
  const minuten =
    sessie.afgerondOp ? Math.max(1, Math.round((new Date(sessie.afgerondOp).getTime() - new Date(sessie.gestartOp).getTime()) / 60_000)) : null;

  const tegels: { icoon: AlleIcoonNamen; waarde: string; label: string }[] = [
    { icoon: "voortgang", waarde: `${zelfstandig} van ${sessie.slots.length}`, label: "zelfstandig goed" },
    { icoon: "hint", waarde: String(ondersteund), label: "met hulp of uitleg" },
    { icoon: "tijd", waarde: minuten ? `${minuten} min` : "–", label: "oefentijd" },
    { icoon: "document", waarde: String(sessie.slots.length), label: "vragen" },
  ];

  return (
    <section aria-labelledby="sessie-titel" className="flex flex-col gap-4">
      <div>
        <h2 id="sessie-titel" className="titel-pagina">
          {sessieNaam(sessie)}
        </h2>
        <p className="mt-1 text-tekst-zacht">
          Oefensessie · {formatDatum(sessie.gestartOp)} · {formatTijd(sessie.gestartOp)}
          {sessie.afgerondOp ? ` – ${formatTijd(sessie.afgerondOp)}` : " · nog bezig"}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
        {tegels.map((t) => (
          <li key={t.label} className="flex items-center gap-3 rounded-[16px] border border-rand-zacht bg-wit p-4">
            <Icoon naam={t.icoon} className="size-7 text-actie-blauw" />
            <span>
              <span className="block text-xl font-extrabold">{t.waarde}</span>
              <span className="block tekst-klein text-tekst-zacht">{t.label}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="overflow-hidden rounded-[16px] border border-rand-zacht bg-wit">
        <table className="w-full text-left max-tablet:block">
          <caption className="sr-only">Vragen in deze oefensessie</caption>
          <thead className="bg-blauw-zacht max-tablet:hidden">
            <tr>
              {["#", "Opgave", "Antwoord", "Resultaat", "Hints", "Uitleg bekeken"].map((k) => (
                <th key={k} scope="col" className="px-4 py-3 font-bold">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rand-zacht max-tablet:block">
            {sessie.slots.map((slot, i) => {
              const vraag = vindVraag(slot.vraagId);
              const pogingenSlot = pogingen.filter((p) => p.slotId === slot.id);
              const ruw = pogingenSlot.at(-1)?.antwoord ?? slot.antwoord;
              const laatste = ruw ? antwoordTekst(vraag, ruw) : "–";
              const uitkomst = slot.uitkomst ? uitkomstTekst[slot.uitkomst] : null;
              const opgave = vraag ? opgaveTekst(vraag) : slot.vraagId;
              return (
                <tr key={slot.id} className="max-tablet:grid max-tablet:grid-cols-2 max-tablet:gap-x-4 max-tablet:gap-y-1 max-tablet:p-4">
                  <td className="px-4 py-3 font-bold max-tablet:col-span-2 max-tablet:p-0">
                    <span className="tablet:hidden">Vraag </span>
                    {i + 1}
                    {slot.herhalingVan && <span className="ml-2 tekst-klein font-normal text-tekst-zacht">(vervolgvraag)</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums max-tablet:p-0">{opgave}</td>
                  <td className="px-4 py-3 max-tablet:p-0">
                    <span className="tablet:hidden">Antwoord: </span>
                    {laatste}
                    {pogingenSlot.length > 1 && <span className="tekst-klein text-tekst-zacht"> ({pogingenSlot.length} pogingen)</span>}
                  </td>
                  <td className="px-4 py-3 max-tablet:p-0">
                    {uitkomst ? (
                      <span className={`inline-flex items-center gap-1 font-semibold ${uitkomst.kleur}`}>
                        <Icoon naam={uitkomst.icoon} className="size-5" />
                        {uitkomst.tekst}
                      </span>
                    ) : (
                      <span className="text-tekst-zacht">Nog niet gemaakt</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-tablet:p-0">
                    <span className="tablet:hidden">Hints: </span>
                    {slot.hulp.hints}
                  </td>
                  <td className="px-4 py-3 max-tablet:p-0">
                    <span className="tablet:hidden">Uitleg: </span>
                    {slot.hulp.uitleg ? "Ja" : "Nee"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="tekst-klein text-tekst-zacht">
        Zelfstandig betekent: in één keer goed, zonder hint of uitleg. Bekeken uitleg is geen bewijs van beheersing.
      </p>
    </section>
  );
}
