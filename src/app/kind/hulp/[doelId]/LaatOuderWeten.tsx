"use client";

import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { laatOuderWeten, type MeldStatus } from "../acties";

export function LaatOuderWeten({ leerdoelId }: { leerdoelId: string }) {
  const [status, actie, bezig] = useActionState<MeldStatus, FormData>(laatOuderWeten, {});
  if (status.gelukt) return <Melding soort="succes">{status.melding}</Melding>;
  return (
    <form action={actie} className="flex flex-col gap-3">
      <input type="hidden" name="leerdoelId" value={leerdoelId} />
      {status.melding && <Melding soort="probeer-opnieuw">{status.melding}</Melding>}
      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full tablet:w-auto tablet:self-start">
        {bezig ? "Even wachten…" : "Laat mijn ouder weten"}
      </PrimaireKnop>
    </form>
  );
}
