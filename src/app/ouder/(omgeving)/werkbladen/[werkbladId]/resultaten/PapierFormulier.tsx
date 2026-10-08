"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { bewaarPapierresultaten, type PapierStatus } from "@/app/werkbladen/acties";

export type Regel = { vraagId: string; uitkomst: "goed" | "fout" | "onbekend"; hulp: "onbekend" | "met-hulp" | "zelfstandig" };

const uitkomsten = [
  { waarde: "goed", tekst: "Goed" },
  { waarde: "fout", tekst: "Fout" },
  { waarde: "onbekend", tekst: "Niet nagekeken" },
] as const;
const hulpopties = [
  { waarde: "zelfstandig", tekst: "Zelfstandig" },
  { waarde: "met-hulp", tekst: "Met hulp" },
  { waarde: "onbekend", tekst: "Niet bekend" },
] as const;

function Keuzes({ naam, opties, standaard, legend }: { naam: string; opties: readonly { waarde: string; tekst: string }[]; standaard: string; legend: string }) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-achtergrond-zacht p-1">
        {opties.map((o) => (
          <label
            key={o.waarde}
            className="grid min-h-12 cursor-pointer place-items-center rounded-[10px] px-1 text-center text-sm font-semibold leading-tight has-[:checked]:bg-actie-blauw has-[:checked]:text-wit has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus tablet:text-base"
          >
            <input type="radio" name={naam} value={o.waarde} defaultChecked={o.waarde === standaard} className="sr-only" />
            {o.tekst}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PapierFormulier({
  werkbladId,
  kinderen,
  kindId,
  regels,
  versie,
  bewaardOp,
}: {
  werkbladId: string;
  kinderen: { id: string; voornaam: string }[];
  kindId: string;
  regels: (Regel & { nummer: number; opgave: string; antwoord: string })[];
  versie: number;
  bewaardOp: string | null;
}) {
  const router = useRouter();
  const [status, actie, bezig] = useActionState<PapierStatus, FormData>(bewaarPapierresultaten, {});
  const kind = kinderen.find((k) => k.id === kindId);

  return (
    <form action={actie} className="flex flex-col gap-5">
      <input type="hidden" name="werkbladId" value={werkbladId} />
      <input type="hidden" name="kindId" value={kindId} />

      {kinderen.length > 1 && (
        <label className="flex flex-col gap-2 font-semibold tablet:max-w-sm">
          Van welk kind is dit werkblad?
          <select
            value={kindId}
            onChange={(e) => router.replace(`/ouder/werkbladen/${werkbladId}/resultaten?kind=${e.target.value}`)}
            className="min-h-12 rounded-[12px] border border-rand-interactief bg-wit px-3 font-normal"
          >
            {kinderen.map((k) => (
              <option key={k.id} value={k.id}>
                {k.voornaam}
              </option>
            ))}
          </select>
        </label>
      )}

      <Melding>
        <p>
          Vul per vraag in wat je ziet. Papierwerk telt apart van wat {kind?.voornaam ?? "je kind"} digitaal oefent.
          {versie > 0 && bewaardOp && <> Laatst bewaard op {new Date(bewaardOp).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}.</>}
        </p>
      </Melding>

      <ol className="flex flex-col gap-3">
        {regels.map((r, i) => (
          <li key={r.vraagId} className="rounded-[16px] border border-rand-zacht bg-wit p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-lg font-bold">
                <span className="mr-2 text-tekst-zacht">{r.nummer}.</span>
                <span className="tabular-nums">{r.opgave}</span>
              </p>
              <p className="tekst-klein text-tekst-zacht">
                Antwoord: <strong className="text-inkt">{r.antwoord}</strong>
              </p>
            </div>
            <div className="mt-3 grid gap-2 tablet:grid-cols-2">
              <Keuzes naam={`uitkomst-${i}`} opties={uitkomsten} standaard={r.uitkomst} legend={`Vraag ${r.nummer}: uitkomst`} />
              <Keuzes naam={`hulp-${i}`} opties={hulpopties} standaard={r.hulp} legend={`Vraag ${r.nummer}: hulp`} />
            </div>
          </li>
        ))}
      </ol>

      {status.melding && <Melding soort={status.gelukt ? "succes" : "fout"}>{status.melding}</Melding>}

      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full tablet:w-auto tablet:self-start">
        {bezig ? "Even wachten…" : "Bewaar resultaten"}
      </PrimaireKnop>
    </form>
  );
}
