"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { KeuzeKaart } from "@/components/mees/KeuzeKaart";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { maakNiveauSessie, niveauGebieden, oefenConfig, type NiveauGebied } from "@/features/oefenen/sessie";
import { wijzigOpslag } from "@/lib/opslag/lokaal";

/** N01: Kind kiest of het een korte niveaubepaling doet; direct zelf kiezen blijft altijd mogelijk. */
export function NiveauStart() {
  const router = useRouter();
  const [gebied, setGebied] = useState<NiveauGebied>("breuken");
  const [fout, setFout] = useState(false);

  function start() {
    let sessieId = "";
    try {
      wijzigOpslag((d) => {
        const r = maakNiveauSessie(d, gebied);
        sessieId = r.sessie.id;
        return r.data;
      });
    } catch {
      setFout(true);
      return;
    }
    router.push(`/kind/niveaubepaling/${sessieId}`);
  }

  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-[1000px] tablet:py-10">
      <TerugLink href="/kind/start">Start</TerugLink>
      <div className="grid items-center gap-6 desktop:grid-cols-[1fr_auto]">
        <div>
          <h1 className="titel-held">Wat past bij jou?</h1>
          <p className="mt-2 subtitel font-semibold text-tekst-zacht">Je hoeft nog niet alles te kunnen.</p>
          <p className="mt-4 max-w-xl text-lg">
            Mees laat je een paar vragen zien ({oefenConfig.niveauVragen} of minder). Zo kijken we samen waarmee je goed kunt beginnen. Er is geen tijd en
            je kunt hints gebruiken.
          </p>
        </div>
        <Mees pose="denkt-na" breedte={200} className="hidden w-44 desktop:block" />
      </div>

      <fieldset>
        <legend className="mb-3 subtitel">Waarmee wil je beginnen?</legend>
        <div className="grid gap-3 tablet:grid-cols-2">
          {(Object.keys(niveauGebieden) as NiveauGebied[]).map((g) => (
            <KeuzeKaart
              key={g}
              naam="gebied"
              waarde={g}
              gekozen={gebied === g}
              onKies={() => setGebied(g)}
              titel={niveauGebieden[g].naam}
              omschrijving={g === "breuken" ? "Welke breuk is groter?" : "Keersommen uit de tafels."}
              icoon={<Icoon naam={g === "breuken" ? "breuken" : "tafels"} className="size-8" />}
            />
          ))}
        </div>
      </fieldset>

      {fout && <Melding soort="fout">Dit lukt nu niet. Probeer het nog eens.</Melding>}

      <div className="flex flex-col gap-3 tablet:flex-row">
        <PrimaireKnop groot onClick={start} className="w-full tablet:w-auto">
          Start
          <Icoon naam="pijl-rechts" />
        </PrimaireKnop>
        <SecundaireKnop groot href="/kind/rekenen" className="w-full tablet:w-auto">
          Liever zelf kiezen
        </SecundaireKnop>
      </div>
    </div>
  );
}
