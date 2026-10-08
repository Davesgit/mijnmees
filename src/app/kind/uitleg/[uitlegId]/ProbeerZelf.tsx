"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { maakControleSessie, sessieRoute } from "@/features/oefenen/sessie";
import { useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";

/** Start (of hervat) de gekoppelde controlevraag op dit apparaat. */
export function ProbeerZelf({ hulpvraagId, vraagId }: { hulpvraagId: string; vraagId: string }) {
  const router = useRouter();
  const opslag = useOpslag();
  const [fout, setFout] = useState(false);
  const bestaand = opslag ? Object.values(opslag.sessies).find((s) => s.soort === "controle" && s.instellingen?.controleVoor === hulpvraagId) : undefined;

  function start() {
    if (bestaand) return router.push(sessieRoute(bestaand));
    let route = "";
    wijzigOpslag((data) => {
      try {
        const r = maakControleSessie(data, { hulpvraagId, vraagId });
        route = sessieRoute(r.sessie);
        return r.data;
      } catch {
        return data;
      }
    });
    if (!route) return setFout(true);
    router.push(route);
  }

  return (
    <section className="flex flex-col gap-3 rounded-[16px] bg-blauw-zacht p-5 tablet:p-6">
      <h2 className="subtitel">Probeer het zelf</h2>
      <p>Een nieuwe vraag, net als in de uitleg. Je tutor ziet hoe het ging.</p>
      {fout && <Melding soort="fout">Dit lukt nu niet. Probeer het nog eens.</Melding>}
      <PrimaireKnop onClick={start} groot className="w-full tablet:w-auto tablet:self-start">
        {bestaand?.status === "afgerond" ? "Bekijk hoe het ging" : bestaand ? "Ga verder" : "Probeer het zelf"}
        <Icoon naam="pijl-rechts" />
      </PrimaireKnop>
    </section>
  );
}
