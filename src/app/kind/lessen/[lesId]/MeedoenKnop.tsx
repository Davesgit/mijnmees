"use client";

import { useActionState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { ikDoeMee, type LesActieStatus } from "../acties";

export function MeedoenKnop({ lesId }: { lesId: string }) {
  const [status, actie, bezig] = useActionState<LesActieStatus, FormData>(ikDoeMee, {});
  return (
    <form action={actie} className="flex flex-col gap-2">
      <input type="hidden" name="lesId" value={lesId} />
      <PrimaireKnop type="submit" groot disabled={bezig}>
        {bezig ? "Even wachten…" : "Ik wil meedoen"}
      </PrimaireKnop>
      {status.melding && <Melding soort="probeer-opnieuw">{status.melding}</Melding>}
    </form>
  );
}
