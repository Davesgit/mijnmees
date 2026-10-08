"use client";

import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { stuurNaarTutor, type HulpStatus } from "@/app/ouder/hulp-acties";

export function StuurFormulier({ kindId, leerdoelId, toegestaan }: { kindId: string; leerdoelId: string; toegestaan: boolean }) {
  const [status, actie, bezig] = useActionState<HulpStatus, FormData>(stuurNaarTutor, {});
  return (
    <form action={actie} className="flex flex-col gap-3">
      <input type="hidden" name="kindId" value={kindId} />
      <input type="hidden" name="leerdoelId" value={leerdoelId} />
      {status.melding && <Melding soort="fout">{status.melding}</Melding>}
      <PrimaireKnop type="submit" groot disabled={bezig || !toegestaan} className="w-full tablet:w-auto tablet:self-start">
        {bezig ? "Even wachten…" : "Stuur naar een tutor"}
        {!bezig && <Icoon naam="pijl-rechts" />}
      </PrimaireKnop>
    </form>
  );
}
