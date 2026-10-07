"use client";

import { useRouter } from "next/navigation";
import { useActionState, useSyncExternalStore } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { InvoerVeld, Vinkje } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { AvatarKiezer, GroepKiezer } from "@/components/mees/KindVelden";
import { kiesProfiel, leesGastOpslag, wijzigOpslag, wisGastgegevens } from "@/lib/opslag/lokaal";
import { synchroniseerNu } from "@/lib/opslag/sync";
import { kindToevoegen, type KindToevoegenStatus } from "../../kind-acties";

const geenAbonnement = () => () => {};

export function KindFormulier() {
  const router = useRouter();
  const gastVoortgang = useSyncExternalStore(geenAbonnement, () => leesGastOpslag() !== null, () => false);

  // Profiel opslaan; daarna eventueel de gastvoortgang van dit apparaat meenemen en naar de profielkiezer.
  const [status, actie, bezig] = useActionState<KindToevoegenStatus & { meenemenFout?: boolean }, FormData>(async (vorige, form) => {
    const resultaat = await kindToevoegen(vorige, form);
    if (!resultaat.gelukt || !resultaat.kindId) return resultaat;
    const gast = resultaat.meenemen ? leesGastOpslag() : null;
    if (gast) {
      kiesProfiel(resultaat.kindId);
      wijzigOpslag(() => ({ ...gast }));
      if (!(await synchroniseerNu(resultaat.kindId))) return { ...resultaat, meenemenFout: true };
      wisGastgegevens();
    }
    router.push("/profielen");
    return resultaat;
  }, {});

  return (
    <form action={actie} className="mt-8 flex flex-col gap-7" noValidate>
      {status.melding && <Melding soort="fout">{status.melding}</Melding>}
      {status.meenemenFout && (
        <Melding soort="probeer-opnieuw">
          Het profiel is gemaakt. Het meenemen van de oefeningen lukte nog niet; dat gebeurt vanzelf zodra je kind op dit apparaat oefent.
        </Melding>
      )}
      <InvoerVeld
        label="Voornaam"
        name="voornaam"
        autoComplete="off"
        maxLength={30}
        placeholder="Bijvoorbeeld: Sam"
        required
        defaultValue={status.waarden?.voornaam}
        fout={status.fouten?.voornaam}
        hulp="Alleen de voornaam. Geen achternaam nodig."
      />
      <GroepKiezer standaard={Number(status.waarden?.groep) || 6} fout={status.fouten?.groep} />
      <AvatarKiezer standaard={status.waarden?.avatar || "vos"} fout={status.fouten?.avatar} />
      {gastVoortgang && (
        <div className="rounded-[16px] bg-blauw-zacht p-4">
          <Vinkje naam="meenemen" defaultChecked>
            <span className="font-bold">Neem de oefeningen van dit apparaat mee</span>
            <span className="block tekst-klein text-tekst-zacht">Er is al geoefend zonder account. Die voortgang en weetjes komen bij dit profiel.</span>
          </Vinkje>
        </div>
      )}
      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full tablet:w-auto tablet:self-start">
        {bezig ? "Even wachten…" : "Profiel aanmaken"}
        {!bezig && <Icoon naam="pijl-rechts" />}
      </PrimaireKnop>
    </form>
  );
}
