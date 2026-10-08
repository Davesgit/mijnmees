"use client";

import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import type { FormStatus } from "@/components/mees/Formulier";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { rondAf } from "@/app/tutor/acties";

const opties = [
  { waarde: "zelfstandig-gelukt", tekst: "De controlevraag lukte zelfstandig", alleen: "zelfstandig" },
  { waarde: "met-hulp-gelukt", tekst: "Lukte met hulp; verder geen tutorhulp nodig", alleen: "met-hulp" },
  { waarde: "andere-hulp", tekst: "Een andere vorm van hulp past beter", alleen: null },
  { waarde: "geen-reactie", tekst: "Uitleg of controlevraag niet gemaakt", alleen: null },
] as const;

export function AfrondFormulier({ hulpvraagId, controle }: { hulpvraagId: string; controle: "zelfstandig" | "met-hulp" | "met-uitleg" | null }) {
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(rondAf, {});
  // Alleen een onderbouwde reden: 'zelfstandig gelukt' kan pas als de controlevraag dat laat zien.
  const beschikbaar = opties.filter((o) => !o.alleen || o.alleen === controle);
  return (
    <form action={actie} className="flex flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-5">
      <input type="hidden" name="hulpvraagId" value={hulpvraagId} />
      <fieldset className="flex flex-col gap-1">
        <legend className="font-bold">Rond hulpvraag af</legend>
        {beschikbaar.map((o) => (
          <label key={o.waarde} className="flex min-h-12 cursor-pointer items-center gap-3">
            <input type="radio" name="reden" value={o.waarde} className="size-6 accent-actie-blauw" />
            {o.tekst}
          </label>
        ))}
      </fieldset>
      {status.fouten?.reden && <p className="font-semibold text-fout">{status.fouten.reden}</p>}
      <label className="flex flex-col gap-1 font-semibold">
        Toelichting (optioneel, zonder namen)
        <input name="toelichting" maxLength={300} className="min-h-12 rounded-[12px] border border-rand-interactief px-3 font-normal" />
      </label>
      {status.melding && <Melding soort="fout">{status.melding}</Melding>}
      <PrimaireKnop type="submit" disabled={bezig} className="self-start">
        Rond af
      </PrimaireKnop>
    </form>
  );
}
