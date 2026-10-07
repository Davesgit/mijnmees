"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { BreukKaartjes } from "@/components/mees/Breuk";
import { Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { KeuzeKaart, StapKop } from "@/components/mees/KeuzeKaart";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { maakSessie, oefenConfig } from "@/features/oefenen/sessie";
import type { Niveau } from "@/features/oefenen/vragen";
import { wijzigOpslag } from "@/lib/opslag/lokaal";

const niveaus: { waarde: Niveau; titel: string; omschrijving: string }[] = [
  { waarde: "makkelijk", titel: "Makkelijk", omschrijving: "Eerst de basis." },
  { waarde: "past-bij-mij", titel: "Past bij mij", omschrijving: "Mees kiest passende vragen." },
  { waarde: "uitdagend", titel: "Uitdagend", omschrijving: "Een stap verder." },
];

type Keuze = { vorm: "scherm" | "papier"; niveau: Niveau; aantal: number };

const standaardKeuze: Keuze = { vorm: "scherm", niveau: "past-bij-mij", aantal: oefenConfig.standaardAantal };
const geenAbonnement = () => () => {};

function leesBewaard(sleutel: string) {
  try {
    return sessionStorage.getItem(sleutel);
  } catch {
    return null;
  }
}

function parseKeuze(ruw: string | null): Partial<Keuze> {
  if (!ruw) return {};
  try {
    const k = JSON.parse(ruw) as Partial<Keuze>;
    const niveauOk = k.niveau === "makkelijk" || k.niveau === "past-bij-mij" || k.niveau === "uitdagend";
    const aantalOk = typeof k.aantal === "number" && k.aantal >= oefenConfig.minAantal && k.aantal <= oefenConfig.maxAantal;
    return { ...(niveauOk ? { niveau: k.niveau } : {}), ...(aantalOk ? { aantal: k.aantal } : {}) };
  } catch {
    return {};
  }
}

export function InstelScherm(props: {
  onderwerpId: string;
  onderwerpNaam: string;
  onderdeelId: string;
  onderdeelNaam: string;
  leerdoelId: string;
}) {
  const router = useRouter();
  const sleutel = `mees:instelling:${props.onderdeelId}`;
  // Bij terug/vooruit blijft de laatste keuze staan (sessionStorage van dit tabblad).
  const bewaard = useSyncExternalStore(geenAbonnement, () => leesBewaard(sleutel), () => null);
  const [wijzigingen, setWijzigingen] = useState<Partial<Keuze>>({});
  const keuze: Keuze = { ...standaardKeuze, ...parseKeuze(bewaard), ...wijzigingen, vorm: "scherm" };
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(false);

  function pasAan(wijziging: Partial<Keuze>) {
    const nieuw = { ...wijzigingen, ...wijziging };
    setWijzigingen(nieuw);
    try {
      sessionStorage.setItem(sleutel, JSON.stringify({ ...keuze, ...wijziging }));
    } catch {}
  }

  function start() {
    setBezig(true);
    setFout(false);
    let sessieId = "";
    try {
      wijzigOpslag((data) => {
        const r = maakSessie(data, {
          leerdoelId: props.leerdoelId,
          onderdeelId: props.onderdeelId,
          onderwerpId: props.onderwerpId,
          niveau: keuze.niveau,
          aantal: keuze.aantal,
          bron: "zelf",
        });
        sessieId = r.sessie.id;
        return r.data;
      });
    } catch {
      setFout(true);
      setBezig(false);
      return;
    }
    router.push(`/kind/oefenen/${sessieId}`);
  }

  const niveauNaam = niveaus.find((n) => n.waarde === keuze.niveau)!.titel;

  return (
    <div className="mees-content flex flex-col py-6 tablet:max-w-[1000px] tablet:py-8 desktop:py-10">
      <TerugLink href={`/kind/rekenen/${props.onderwerpId}`}>{props.onderwerpNaam}</TerugLink>

      <div className="mt-2 flex items-center justify-between gap-6">
        <div>
          <h1 className="titel-held">{props.onderdeelNaam}</h1>
          <p className="mt-2 subtitel font-semibold text-tekst-zacht">Stel je oefening in.</p>
        </div>
        <div className="hidden items-end gap-2 tablet:flex" aria-hidden>
          <Mees pose="helpt" breedte={200} className="w-40 desktop:w-48" />
        </div>
      </div>

      <form
        className="mt-6 flex flex-col gap-8 tablet:mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <fieldset>
          <StapKop nummer={1} id="vorm">Hoe wil je oefenen?</StapKop>
          <div className="grid gap-3 min-[480px]:grid-cols-2 tablet:gap-4">
            <KeuzeKaart
              naam="vorm"
              waarde="scherm"
              gekozen={keuze.vorm === "scherm"}
              onKies={() => pasAan({ vorm: "scherm" })}
              titel="Op het scherm"
              icoon={<Icoon naam="scherm" className="size-8" />}
            />
            <KeuzeKaart
              naam="vorm"
              waarde="papier"
              gekozen={false}
              onKies={() => {}}
              titel="Op papier"
              reden="Werkbladen komen binnenkort."
              uitgeschakeld
              icoon={<Icoon naam="printer" className="size-8" />}
            />
          </div>
        </fieldset>

        <fieldset>
          <StapKop nummer={2} id="niveau">Welk niveau?</StapKop>
          <div className="grid gap-3 tablet:grid-cols-3 tablet:gap-4">
            {niveaus.map((n) => (
              <KeuzeKaart
                key={n.waarde}
                naam="niveau"
                waarde={n.waarde}
                gekozen={keuze.niveau === n.waarde}
                onKies={() => pasAan({ niveau: n.waarde })}
                titel={n.titel}
                omschrijving={n.omschrijving}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <StapKop nummer={3} id="aantal">Hoeveel vragen?</StapKop>
          <div className="flex items-center justify-between gap-4 rounded-[16px] border border-rand-interactief bg-wit p-2 tablet:max-w-sm">
            <button
              type="button"
              onClick={() => pasAan({ aantal: Math.max(oefenConfig.minAantal, keuze.aantal - 1) })}
              disabled={keuze.aantal <= oefenConfig.minAantal}
              className="grid size-12 place-items-center rounded-full bg-blauw-zacht text-actie-blauw hover:bg-[#d9ecfd] disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst"
              aria-label="Eén vraag minder"
            >
              <Icoon naam="min" />
            </button>
            <output aria-live="polite" aria-labelledby="aantal" className="text-3xl font-extrabold tabular-nums">
              {keuze.aantal}
            </output>
            <button
              type="button"
              onClick={() => pasAan({ aantal: Math.min(oefenConfig.maxAantal, keuze.aantal + 1) })}
              disabled={keuze.aantal >= oefenConfig.maxAantal}
              className="grid size-12 place-items-center rounded-full bg-actie-blauw text-wit hover:bg-actie-hover disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst"
              aria-label="Eén vraag meer"
            >
              <Icoon naam="plus" />
            </button>
          </div>
          <p className="mt-2 tekst-klein text-tekst-zacht">
            Kies {oefenConfig.minAantal} tot {oefenConfig.maxAantal} vragen. Je kunt altijd stoppen.
          </p>
        </fieldset>

        <div className="flex justify-center tablet:hidden" aria-hidden>
          <div className="flex items-end gap-2">
            <Mees pose="blij" breedte={100} className="w-24" />
            <BreukKaartjes links={[1, 2]} rechts={[3, 4]} klein />
          </div>
        </div>

        {fout && <Melding soort="fout">Dit lukt nu niet. Je invoer blijft staan. Probeer het nog eens.</Melding>}

        <div className="flex flex-col items-stretch gap-3 tablet:flex-row tablet:items-center tablet:gap-5">
          <PrimaireKnop type="submit" groot disabled={bezig} className="w-full tablet:w-auto">
            {bezig ? "Even wachten…" : "Start oefenen"}
            {!bezig && <Icoon naam="pijl-rechts" />}
          </PrimaireKnop>
          <p className="text-center text-tekst-zacht tablet:border-l tablet:border-rand-zacht tablet:pl-5 tablet:text-left">
            {keuze.aantal} vragen · {niveauNaam}
          </p>
        </div>
      </form>
    </div>
  );
}
