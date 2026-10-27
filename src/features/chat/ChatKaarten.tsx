"use client";

import { useMemo, useState } from "react";
import { Icoon, type AlleIcoonNamen } from "@/components/mees/Icoon";
import { vindOnderdeelBijLeerdoel } from "@/content/onderwerpen";
import { alleEuropaVragen } from "@/features/oefenen/europa-vragen";
import { MICROSTATEN, europaMeta, europaOnderwerpen, landenVanGebieden, telEuropaOnderdelen, type EuropaOnderwerp } from "@/features/oefenen/europa-sessie";
import { tijdKeuzes } from "@/features/oefenen/sessie";
import { TAFELS } from "@/features/oefenen/tafel-vragen";
import type { OpslagData } from "@/features/oefenen/types";
import { leerdoelNaam, leerdoelSoort } from "@/features/oefenen/weergave";
import type { BewijsStatus, LeerdoelBewijs } from "@/features/voortgang/bewijs";
import { useOpslag } from "@/lib/opslag/lokaal";
import { TypOnthul } from "./ChatOnthul";
import { doelVoortgang, tafelOverzicht, voortgangVan, type TafelCel, type VoortgangFilter } from "./voortgang-chat";
import { AANTAL_KEUZES, STANDAARD_AANTAL } from "./oefen-verloop";

// Kaarten in berichten van Mees: alles wat een kind kiest of bekijkt, gebeurt in het gesprek.
// Alleen de kaart in het nieuwste bericht is te bedienen; oudere kaarten blijven als geschiedenis staan.

export type TafelInstelling = { tafels: number[]; bewerkingen: ("x" | ":")[]; aantal: number; metTijd: boolean; seconden: number };

const keuzeKnop = (gekozen: boolean, actief: boolean) =>
  `rounded-[14px] border p-3 text-left ${gekozen ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-[#d8e9f8] bg-[#f6fbff]"} ${actief ? "hover:border-actie-blauw" : "cursor-default opacity-70"}`;

const startKnop =
  "mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-actie-blauw px-6 text-lg font-bold text-wit hover:bg-actie-hover disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst";

function Aantal({ aantal, setAantal, actief }: { aantal: number; setAantal: (n: number) => void; actief: boolean }) {
  return (
    <>
      <p className="mt-4 font-bold">Hoeveel vragen wil je doen?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {AANTAL_KEUZES.map((n) => (
          <button key={n} type="button" aria-pressed={aantal === n} onClick={() => setAantal(n)} className={`${keuzeKnop(aantal === n, actief)} text-center`}>
            <span className="block text-2xl font-extrabold">{n}</span>
            <span className="block tekst-klein text-tekst-zacht">{n === 4 ? "Even proberen" : n === 6 ? "Een kort rondje" : "Wat langer oefenen"}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/** Onderwerpen voor het oefenvoorstel (rekenen). */
export function voorstelOpties(data: OpslagData) {
  const doel = vindOnderdeelBijLeerdoel(data.reviews.find((r) => leerdoelSoort(r.leerdoelId) === "breuken")?.leerdoelId ?? "breuken-vergelijken") ?? vindOnderdeelBijLeerdoel("breuken-vergelijken")!;
  return [{ id: `doel:${doel.onderdeel.id}`, naam: doel.onderdeel.naam, uitleg: doel.onderdeel.omschrijving }];
}

/** Oefenvoorstel (rekenen): onderwerp en aantal vragen kiezen. */
export function VoorstelKaart({ standaard, actief, onStart }: { standaard: string; actief: boolean; onStart: (keuze: string, aantal: number, label: string) => void }) {
  const opslag = useOpslag();
  const opties = opslag ? voorstelOpties(opslag) : [];
  const [keuze, setKeuze] = useState(standaard.startsWith("doel:") ? standaard : (opties[0]?.id ?? standaard));
  const [aantal, setAantal] = useState<number>(STANDAARD_AANTAL);
  return (
    <fieldset disabled={!actief} className="mt-4">
      <legend className="font-bold">Wat wil je oefenen?</legend>
      <div className="mt-2 grid gap-2 tablet:grid-cols-2">
        {opties.map((o) => (
          <button key={o.id} type="button" aria-pressed={keuze === o.id} onClick={() => setKeuze(o.id)} className={keuzeKnop(keuze === o.id, actief)}>
            <span className="block font-bold">{o.naam}</span>
            <span className="mt-0.5 block tekst-klein text-tekst-zacht">{o.uitleg}</span>
          </button>
        ))}
      </div>
      <Aantal aantal={aantal} setAantal={setAantal} actief={actief} />
      <p className="mt-3 tekst-klein text-tekst-zacht">Geen haast. Je kunt altijd een hint vragen of even pauze nemen.</p>
      {actief && (
        <button type="button" onClick={() => onStart(keuze, aantal, `Start mijn ${aantal} vragen`)} className={startKnop}>
          Start mijn {aantal} vragen
          <Icoon naam="pijl-rechts" className="size-6" />
        </button>
      )}
    </fieldset>
  );
}

/** Tafels kiezen: welke tafels, keer/delen, aantal en eventueel op tijd. */
export function TafelKaart({ tafels: begin, bewerking: beginBewerking, actief, onStart }: { tafels: number[]; bewerking?: "x" | ":" | "beide"; actief: boolean; onStart: (i: TafelInstelling, label: string) => void }) {
  const [tafels, setTafels] = useState<number[]>(begin.filter((t) => (TAFELS as readonly number[]).includes(t)));
  const [bewerking, setBewerking] = useState<"x" | ":" | "beide">(beginBewerking ?? "x");
  const [aantal, setAantal] = useState<number>(STANDAARD_AANTAL);
  const [metTijd, setMetTijd] = useState(false);
  const [seconden, setSeconden] = useState<number>(tijdKeuzes[1].seconden);
  const wissel = (t: number) => setTafels((h) => (h.includes(t) ? h.filter((x) => x !== t) : [...h, t].sort((a, b) => a - b)));

  return (
    <fieldset disabled={!actief} className="mt-4">
      <legend className="font-bold">Welke tafels?</legend>
      <div className="mt-2 grid grid-cols-6 gap-2">
        {TAFELS.map((t) => {
          const aan = tafels.includes(t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={aan}
              aria-label={`Tafel van ${t}`}
              onClick={() => wissel(t)}
              className={`grid min-h-12 place-items-center rounded-[12px] border text-xl font-bold tablet:min-h-14 ${aan ? "border-actie-blauw bg-actie-blauw text-wit" : "border-[#c9dcef] bg-[#f6fbff]"} ${actief ? "" : "cursor-default opacity-70"}`}
            >
              {t}
            </button>
          );
        })}
      </div>
      <button type="button" onClick={() => setTafels(tafels.length === 10 && !tafels.includes(11) ? [] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])} className="mt-2 min-h-10 rounded-[10px] px-2 tekst-klein font-semibold text-actie-blauw hover:bg-blauw-zacht">
        {tafels.length === 10 && !tafels.includes(11) ? "Niets kiezen" : "Tafels 1 tot en met 10"}
      </button>

      <p className="mt-3 font-bold">Keersommen of deelsommen?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(
          [
            ["x", "Keer", "3 × 4"],
            [":", "Delen", "12 : 4"],
            ["beide", "Allebei", "Door elkaar"],
          ] as const
        ).map(([waarde, naam, voorbeeld]) => (
          <button key={waarde} type="button" aria-pressed={bewerking === waarde} onClick={() => setBewerking(waarde)} className={`${keuzeKnop(bewerking === waarde, actief)} text-center`}>
            <span className="block font-bold">{naam}</span>
            <span className="block tekst-klein text-tekst-zacht">{voorbeeld}</span>
          </button>
        ))}
      </div>

      <Aantal aantal={aantal} setAantal={setAantal} actief={actief} />

      <p className="mt-4 font-bold">Op tijd oefenen?</p>
      <div className="mt-2 grid grid-cols-2 gap-2 tablet:grid-cols-4">
        <button type="button" aria-pressed={!metTijd} onClick={() => setMetTijd(false)} className={`${keuzeKnop(!metTijd, actief)} text-center`}>
          <span className="block font-bold">Zonder tijd</span>
          <span className="block tekst-klein text-tekst-zacht">Rustig aan</span>
        </button>
        {tijdKeuzes.map((k) => {
          const gekozen = metTijd && seconden === k.seconden;
          return (
            <button
              key={k.seconden}
              type="button"
              aria-pressed={gekozen}
              onClick={() => {
                setMetTijd(true);
                setSeconden(k.seconden);
              }}
              className={`${keuzeKnop(gekozen, actief)} text-center`}
            >
              <span className="block font-bold">{k.titel}</span>
              <span className="block tekst-klein text-tekst-zacht">{k.seconden} sec per vraag</span>
            </button>
          );
        })}
      </div>

      {actief && (
        <button
          type="button"
          disabled={tafels.length === 0}
          onClick={() =>
            onStart(
              { tafels, bewerkingen: bewerking === "beide" ? ["x", ":"] : [bewerking], aantal, metTijd, seconden },
              `Tafel${tafels.length > 1 ? "s" : ""} van ${tafels.join(", ")}: ${aantal} vragen${metTijd ? `, ${seconden} seconden per vraag` : ""}`,
            )
          }
          className={startKnop}
        >
          {tafels.length === 0 ? "Kies eerst een tafel" : `Start mijn ${aantal} vragen`}
          {tafels.length > 0 && <Icoon naam="pijl-rechts" className="size-6" />}
        </button>
      )}
    </fieldset>
  );
}

export type EuropaInstelling = { gebieden: string[]; landen: string[]; onderwerpen: EuropaOnderwerp[]; vorm: "afwisselend" | "puzzel" };

const gebiedVolgorde = ["heel", "north", "west", "south", "east", "central", "southeast"];
const gebiedNaam = (id: string) => (id === "heel" ? "Heel Europa" : (europaMeta.gebieden.find((g) => g.id === id)?.naam ?? id));

/** Europa kiezen: gebied, vorm (vragen of puzzel), onderwerpen en de heel kleine landen. */
export function EuropaKaart({
  vorm: beginVorm,
  onderwerpen: beginOnderwerpen,
  actief,
  onStart,
}: {
  vorm?: "afwisselend" | "puzzel";
  onderwerpen?: string[];
  actief: boolean;
  onStart: (i: EuropaInstelling, label: string) => void;
}) {
  const [gebieden, setGebieden] = useState<string[]>(["west"]);
  const [vorm, setVorm] = useState<"afwisselend" | "puzzel">(beginVorm ?? "afwisselend");
  const [onderwerpen, setOnderwerpen] = useState<EuropaOnderwerp[]>(
    (beginOnderwerpen?.filter((o) => europaOnderwerpen.some((x) => x.id === o)) as EuropaOnderwerp[] | undefined) ?? ["landen"],
  );
  const [metMicrostaten, setMetMicrostaten] = useState(true);

  const gebiedLanden = useMemo(() => landenVanGebieden(gebieden), [gebieden]);
  const heeftMicrostaten = gebiedLanden.some((id) => (MICROSTATEN as readonly string[]).includes(id));
  const landen = useMemo(() => (metMicrostaten ? gebiedLanden : gebiedLanden.filter((id) => !(MICROSTATEN as readonly string[]).includes(id))), [gebiedLanden, metMicrostaten]);
  const liggingMogelijk = useMemo(() => alleEuropaVragen().some((v) => v.module === "relative" && (v.vereist ?? [v.doel]).every((id) => landen.includes(id))), [landen]);
  const gekozen = onderwerpen.filter((o) => o !== "ligging" || liggingMogelijk);
  const aantal = vorm === "puzzel" ? landen.length : telEuropaOnderdelen(landen, gekozen);
  const kan = landen.length > 0 && (vorm === "puzzel" ? landen.length >= 2 : gekozen.length > 0);

  function wisselGebied(id: string) {
    setGebieden((g) => {
      if (id === "heel") return g.includes("heel") ? [] : ["heel"];
      const zonder = g.filter((x) => x !== "heel");
      return zonder.includes(id) ? zonder.filter((x) => x !== id) : [...zonder, id];
    });
  }

  return (
    <fieldset disabled={!actief} className="mt-4">
      <legend className="font-bold">Welk gebied?</legend>
      <div className="mt-2 grid grid-cols-2 gap-2 tablet:grid-cols-4">
        {gebiedVolgorde.map((id) => (
          <button key={id} type="button" aria-pressed={gebieden.includes(id)} onClick={() => wisselGebied(id)} className={`${keuzeKnop(gebieden.includes(id), actief)} font-bold`}>
            {gebiedNaam(id)}
          </button>
        ))}
      </div>
      {heeftMicrostaten && (
        <button
          type="button"
          aria-pressed={!metMicrostaten}
          onClick={() => setMetMicrostaten((m) => !m)}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-[10px] px-2 tekst-klein font-semibold text-actie-blauw hover:bg-blauw-zacht"
        >
          <span aria-hidden className={`grid size-5 place-items-center rounded-[6px] border-2 ${!metMicrostaten ? "border-actie-blauw bg-actie-blauw text-wit" : "border-rand-interactief"}`}>
            {!metMicrostaten && <Icoon naam="check" className="size-4" />}
          </span>
          Heel kleine landen overslaan (zoals Monaco en Vaticaanstad)
        </button>
      )}

      <p className="mt-4 font-bold">Hoe wil je oefenen?</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(
          [
            ["afwisselend", "Vragen", "Aanwijzen en kiezen", "landen"],
            ["puzzel", "Landenpuzzel", "Leg landen op hun plek", "puzzel"],
          ] as const
        ).map(([waarde, naam, uitleg, icoon]) => (
          <button key={waarde} type="button" aria-pressed={vorm === waarde} onClick={() => setVorm(waarde)} className={`${keuzeKnop(vorm === waarde, actief)} flex items-center gap-3`}>
            <Icoon naam={icoon as AlleIcoonNamen} className="size-7 shrink-0 text-actie-blauw" />
            <span>
              <span className="block font-bold">{naam}</span>
              <span className="block tekst-klein text-tekst-zacht">{uitleg}</span>
            </span>
          </button>
        ))}
      </div>

      {vorm === "afwisselend" && (
        <>
          <p className="mt-4 font-bold">Wat wil je oefenen?</p>
          <div className="mt-2 grid grid-cols-2 gap-2 tablet:grid-cols-3">
            {europaOnderwerpen.map((o) => {
              const uit = o.id === "ligging" && !liggingMogelijk;
              const aan = onderwerpen.includes(o.id) && !uit;
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={uit || !actief}
                  aria-pressed={aan}
                  onClick={() => setOnderwerpen((h) => (h.includes(o.id) ? h.filter((x) => x !== o.id) : [...h, o.id]))}
                  className={`${keuzeKnop(aan, actief && !uit)} flex items-center gap-2 disabled:opacity-50`}
                >
                  <Icoon naam={o.icoon as AlleIcoonNamen} className="size-6 shrink-0 text-actie-blauw" />
                  <span>
                    <span className="block font-bold">{o.naam}</span>
                    {uit && <span className="block tekst-klein text-tekst-zacht">Nog niet voor dit gebied</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-3 tekst-klein text-tekst-zacht">
        {!kan
          ? vorm === "puzzel"
            ? "Kies een gebied met minstens twee landen."
            : "Kies een gebied en iets om te oefenen."
          : vorm === "puzzel"
            ? `${aantal} landen om te leggen. Je kunt altijd even pauze nemen.`
            : `Je oefent alles uit je keuze: ${aantal} onderdelen. Je kunt altijd even pauze nemen.`}
      </p>
      {actief && (
        <button
          type="button"
          disabled={!kan}
          onClick={() =>
            onStart(
              { gebieden, landen, onderwerpen: gekozen, vorm },
              vorm === "puzzel" ? `Landenpuzzel: ${gebieden.map(gebiedNaam).join(" + ")}` : `${gebieden.map(gebiedNaam).join(" + ")}: ${gekozen.map((o) => europaOnderwerpen.find((x) => x.id === o)!.naam.toLowerCase()).join(", ")}`,
            )
          }
          className={startKnop}
        >
          {vorm === "puzzel" ? "Start de puzzel" : "Start met oefenen"}
          <Icoon naam="pijl-rechts" className="size-6" />
        </button>
      )}
    </fieldset>
  );
}

const groepen: { status: BewijsStatus; titel: string; symbool: string; regel: string }[] = [
  { status: "nog-eens-oefenen", titel: "Nog eens oefenen", symbool: "🔁", regel: "Al even geleden. Kijk of het nog lukt." },
  { status: "aan-het-oefenen", titel: "Aan het oefenen", symbool: "💪", regel: "Blijf dit oefenen." },
  { status: "gaat-zelfstandig", titel: "Gaat zelfstandig", symbool: "⭐", regel: "Dit lukt je zonder hulp." },
];

/** Balkje met hoe dichtbij ⭐ zelfstandig is, en wat er nog nodig is. */
function Doel({ bewijs }: { bewijs: LeerdoelBewijs }) {
  const { deel, tekst } = doelVoortgang(bewijs);
  return (
    <span className="mt-1 flex items-center gap-2">
      <span className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-[#dcebf8] tablet:w-32" aria-hidden>
        <span className={`block h-full rounded-full ${deel >= 1 ? "bg-succes" : "bg-merk-blauw"}`} style={{ width: `${Math.round(deel * 100)}%` }} />
      </span>
      <span className="tekst-klein text-tekst-zacht">{tekst}</span>
    </span>
  );
}

const tafelKleur: Record<BewijsStatus, string> = {
  "gaat-zelfstandig": "border-[#86d3a6] bg-succes-zacht text-succes",
  "aan-het-oefenen": "border-[#9fcdfb] bg-blauw-zacht text-actie-blauw",
  "nog-eens-oefenen": "border-[#e2a23b] bg-probeer-opnieuw-zacht text-probeer-opnieuw",
};
const tafelSymbool: Record<BewijsStatus, string> = { "gaat-zelfstandig": "⭐", "aan-het-oefenen": "💪", "nog-eens-oefenen": "🔁" };
const tafelUitleg: Record<BewijsStatus, string> = { "gaat-zelfstandig": "gaat zelfstandig", "aan-het-oefenen": "aan het oefenen", "nog-eens-oefenen": "nog eens oefenen" };

/** Alle tafels in één oogopslag: per tafel een vakje met kleur en symbool. */
function TafelRij({ titel, cellen }: { titel: string; cellen: TafelCel[] }) {
  return (
    <div>
      <p className="mb-1.5 tekst-klein font-bold text-tekst-zacht">{titel}</p>
      <ul className="grid grid-cols-6 gap-1.5 tablet:grid-cols-12">
        {cellen.map((c) => (
          <li
            key={c.tafel}
            className={`flex min-h-12 flex-col items-center justify-center rounded-[10px] border font-extrabold leading-none ${c.status ? tafelKleur[c.status] : "border-dashed border-[#c9dcef] text-[#9aaccc]"}`}
            aria-label={`${titel === "Delen" ? "Delen door" : "Tafel van"} ${c.tafel}: ${c.status ? tafelUitleg[c.status] : "nog niet geoefend"}`}
          >
            <span aria-hidden>{c.tafel}</span>
            {c.status && (
              <span className="mt-0.5 text-[0.7rem]" aria-hidden>
                {tafelSymbool[c.status]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Voortgang in het gesprek (alles of één onderdeel). Alleen weergave: oefenen kies je in de chatbalk.
 * Tafels staan in één overzicht; bij elk onderdeel een balkje met wat er nog nodig is voor ⭐.
 * Bij een nieuw antwoord bouwt het overzicht zich blok voor blok op, zoals Mees typt.
 */
export function VoortgangKaart({ filter = "alles" }: { filter?: VoortgangFilter }) {
  const opslag = useOpslag();
  if (!opslag) return null;
  const items = voortgangVan(opslag, filter);
  if (items.length === 0) return null;
  const tafels = tafelOverzicht(items);
  const tafelItems = items.filter((b) => leerdoelSoort(b.leerdoelId) === "tafels");
  const overige = items.filter((b) => leerdoelSoort(b.leerdoelId) !== "tafels");
  const tafelsBezig = tafelItems.filter((b) => b.status !== "gaat-zelfstandig");
  return (
    <TypOnthul className="mt-4 flex flex-col gap-3">
      {(tafels.keer || tafels.delen) && (
        <section className="rounded-[14px] border border-[#d8e9f8] p-4">
          <h4 className="font-extrabold">Tafels</h4>
          <div className="mt-2 flex flex-col gap-3">
            {tafels.keer && <TafelRij titel="Keer" cellen={tafels.keer} />}
            {tafels.delen && <TafelRij titel="Delen" cellen={tafels.delen} />}
          </div>
          <p className="mt-2 tekst-klein text-tekst-zacht">⭐ gaat zelfstandig · 💪 aan het oefenen · 🔁 nog eens oefenen</p>
          {tafelsBezig.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2 border-t border-[#e4effa] pt-3">
              {tafelsBezig.map((b) => (
                <li key={b.leerdoelId}>
                  <span className="block font-bold">{leerdoelNaam(b.leerdoelId)}</span>
                  <Doel bewijs={b} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {groepen.map((g) => {
        const lijst = overige.filter((b) => b.status === g.status);
        if (lijst.length === 0) return null;
        return (
          <section key={g.status} className="overflow-hidden rounded-[14px] border border-[#d8e9f8]">
            <h4 className="flex items-center gap-2 bg-[#f2f8ff] px-4 py-2.5 font-extrabold">
              <span aria-hidden>{g.symbool}</span>
              {g.titel}
              <span className="font-semibold text-tekst-zacht">· {lijst.length}</span>
            </h4>
            <ul className="divide-y divide-[#e4effa]">
              {lijst.map((b) => (
                <li key={b.leerdoelId} className="flex items-center gap-3 px-4 py-2.5">
                  <Icoon naam={leerdoelSoort(b.leerdoelId) === "europa" ? "landen" : "breuken"} className="size-6 shrink-0 text-actie-blauw" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{leerdoelNaam(b.leerdoelId)}</span>
                    <Doel bewijs={b} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="tekst-klein text-tekst-zacht">⭐ haal je als je iets bij verschillende oefenmomenten zelf goed doet, zonder hint. Mees kijkt dus niet naar één keer.</p>
    </TypOnthul>
  );
}
