"use client";

import { useEffect, useState } from "react";
import { TekstMetBreuken } from "@/components/mees/Breuk";
import { Icoon } from "@/components/mees/Icoon";
import { landPerId, viewBoxVan } from "@/features/europa/kaart";
import { KaartVlak, type KaartLaag } from "@/features/europa/KaartVlak";
import { legPuzzelstukNaUitleg, registreerAntwoord, vraagHulp, werkPuzzelBij } from "@/features/oefenen/sessie";
import type { OpslagData, Sessie } from "@/features/oefenen/types";
import { goedAntwoordTekst, vindVraag, type EuropaVraag } from "@/features/oefenen/vragen";
import { hintVoorleesTekst, uitlegVoorleesTekst } from "@/features/voorlezen/teksten";
import { haalOpslag } from "@/lib/opslag/lokaal";
import { MeesAfzender, VoorleesLink } from "./ChatVoorlezen";

// Europa in het gesprek. Alleen de vraag die openstaat heeft een (interactieve) kaart; eerdere pogingen staan als
// tekst in het gesprek. Zo blijft een lang gesprek snel, ook met tientallen vragen.

/** Hoogte van de kaart in een bericht: groot genoeg om te tikken, met ruimte voor de vraag en knoppen. */
export const kaartHoogte = "h-[clamp(260px,52dvh,560px)] tablet:h-[clamp(320px,58dvh,640px)]";

export function laagVoor(vraag: EuropaVraag): KaartLaag | null {
  if (vraag.type !== "map-click") return null;
  switch (vraag.module) {
    case "capitals":
      return "hoofdsteden";
    case "waters":
      return "wateren";
    case "rivers":
      return "rivieren";
    case "mountains":
      return "gebergten";
    default:
      return "landen";
  }
}

/** De open Europa-vraag: kaart en (bij meerkeuze) de antwoorden. */
export function EuropaOpgave({
  vraag,
  sessie,
  opties,
  gekozen,
  onKies,
}: {
  vraag: EuropaVraag;
  sessie: Sessie;
  opties: { id: string; label: string }[];
  gekozen: string;
  onKies: (id: string) => void;
}) {
  const laag = laagVoor(vraag);
  const isLigging = vraag.module === "relative";
  return (
    <>
      <div className="relative mt-3 -mx-2 overflow-hidden rounded-[16px] border border-[#d8e9f8] tablet:mx-0">
        <KaartVlak
          className={`w-full ${kaartHoogte}`}
          label={vraag.type === "map-click" ? "Kaart van Europa. Tik een plek aan." : "Kaart van Europa."}
          selectie={sessie.instellingen?.landen ?? []}
          stijl={vraag.type === "map-click" && vraag.module === "countries" ? "gekleurd" : "neutraal"}
          laag={laag}
          gekozen={vraag.type === "map-click" ? gekozen || null : null}
          onKies={laag ? onKies : undefined}
          markering={vraag.markering ?? (isLigging ? vraag.referentie : null)}
          donker={isLigging ? opties.map((o) => o.id).filter((id) => landPerId.has(id)) : []}
        />
      </div>
      {vraag.type === "map-click" ? (
        <p className="mt-2 tekst-klein font-semibold text-actie-blauw" aria-live="polite">
          {gekozen ? `Je hebt een plek gekozen.` : "Tik een plek aan op de kaart. Knijp of dubbeltik om in te zoomen."}
        </p>
      ) : (
        <fieldset className="mt-3">
          <legend className="sr-only">Kies één antwoord.</legend>
          <div className="grid grid-cols-2 gap-2">
            {opties.map((o) => {
              const aan = gekozen === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={aan}
                  onClick={() => onKies(o.id)}
                  className={`flex min-h-14 items-center gap-2 rounded-[14px] border px-3 text-left font-bold ${aan ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-rand-interactief bg-[#f5faff] hover:bg-blauw-zacht"}`}
                >
                  <span aria-hidden className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${aan ? "border-actie-blauw bg-actie-blauw" : "border-rand-interactief"}`}>
                    {aan && <span className="size-2.5 rounded-full bg-wit" />}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </>
  );
}

/** Na de uitleg: de goede plek op de kaart. */
export function EuropaUitlegKaart({ vraag, sessie }: { vraag: EuropaVraag; sessie: Sessie }) {
  if (vraag.type !== "map-click") return null;
  return (
    <div className="mt-3 overflow-hidden rounded-[16px] border border-[#d8e9f8]">
      <KaartVlak className={`w-full ${kaartHoogte}`} label={`Kaart van Europa met ${vraag.doelNaam}.`} selectie={sessie.instellingen?.landen ?? []} stijl="neutraal" laag={null} toonDoel={vraag.doel} />
    </div>
  );
}

const meldTekst = {
  goed: "Goed gelegd!",
  goedMetHulp: "Goed gelegd. Je hebt de hulp gebruikt.",
  eersteFout: "Dat is nog niet de goede plek. Kijk nog eens.",
  hintEen: "Probeer het met deze aanwijzing.",
  hintTwee: "Hier is nog een aanwijzing.",
  uitleg: "Kijk waar het land ligt. Daarna kun je verder.",
};

/**
 * Landenpuzzel in het gesprek: één grote kaart. Kies een stukje en tik de plek aan.
 * Alleen interactief als dit het nieuwste bericht is; anders een korte samenvatting.
 */
export function PuzzelBlok({ sessie, interactief, bewaar }: { sessie: Sessie; interactief: boolean; bewaar: (w: (d: OpslagData) => OpslagData) => void }) {
  const landen = sessie.instellingen?.landen ?? [];
  const open = sessie.slots.filter((s) => !s.uitkomst);
  const gelegd = sessie.slots
    .filter((s) => s.uitkomst)
    .map((s) => vindVraag(s.vraagId))
    .filter((v): v is EuropaVraag => v?.soort === "europa")
    .map((v) => v.doel);
  const [gekozenSlot, setGekozenSlot] = useState<string | null>(open[0]?.id ?? null);
  const [melding, setMelding] = useState<{ soort: "goed" | "fout"; tekst: string } | null>(null);

  const slot = sessie.slots.find((s) => s.id === gekozenSlot && !s.uitkomst) ?? open[0] ?? null;
  const vraag = slot ? vindVraag(slot.vraagId) : null;
  const europa = vraag?.soort === "europa" ? vraag : null;
  const uitleg = Boolean(slot?.hulp.uitleg);

  useEffect(() => {
    if (melding?.soort !== "goed") return;
    const t = setTimeout(() => setMelding(null), 2500);
    return () => clearTimeout(t);
  }, [melding]);

  if (!interactief) {
    return (
      <div className="w-full rounded-[20px] border border-[#e9f5ff] bg-wit px-5 py-4 opacity-90 tablet:max-w-[92%]">
        <MeesAfzender />
        <p className="mt-2 font-bold">Landenpuzzel</p>
        <p className="text-tekst-zacht">
          {gelegd.length} van {sessie.slots.length} landen geplaatst.
        </p>
      </div>
    );
  }

  function leg(landId: string) {
    if (!slot || uitleg) return;
    let beoordeling: "goed" | "fout" | null = null;
    bewaar((d) => {
      const r = registreerAntwoord(d, sessie.id, landId, { slotId: slot.id });
      if (!r) return d;
      beoordeling = r.beoordeling;
      return r.data;
    });
    const na = haalOpslag().sessies[sessie.id]?.slots.find((s) => s.id === slot.id);
    if (beoordeling === "goed") {
      setMelding({ soort: "goed", tekst: na?.uitkomst === "zelfstandig" ? meldTekst.goed : meldTekst.goedMetHulp });
      setGekozenSlot(haalOpslag().sessies[sessie.id]?.slots.find((s) => !s.uitkomst)?.id ?? null);
      bewaar((d) => werkPuzzelBij(d, sessie.id));
    } else if (beoordeling === "fout" && na) {
      const f = na.hulp.fouten;
      setMelding({ soort: "fout", tekst: f >= 4 ? meldTekst.uitleg : f === 3 ? meldTekst.hintTwee : f === 2 ? meldTekst.hintEen : meldTekst.eersteFout });
    }
  }

  function legNaUitleg() {
    if (!slot) return;
    bewaar((d) => legPuzzelstukNaUitleg(d, sessie.id, slot.id));
    setGekozenSlot(haalOpslag().sessies[sessie.id]?.slots.find((s) => !s.uitkomst)?.id ?? null);
    setMelding(null);
    bewaar((d) => werkPuzzelBij(d, sessie.id));
  }

  const tray = open.slice(0, 5);
  const hints = slot?.hulp.hints ?? 0;

  return (
    <div className="w-full rounded-[20px] border border-[#e9f5ff] bg-wit px-4 py-4 shadow-[0_8px_24px_#92c5eb17] tablet:px-5">
      <MeesAfzender />
      <h3 className="mt-2 text-xl font-extrabold">Leg de landen op hun plek</h3>
      <p className="text-[#5b6fae]">Tik een land aan en tik daarna op de kaart.</p>

      <div className="mt-3 grid gap-3 desktop:grid-cols-[1fr_15rem]">
        <div className="relative overflow-hidden rounded-[16px] border border-[#d8e9f8]">
          <KaartVlak
            className={`w-full ${kaartHoogte}`}
            label="Kaart van Europa. Kies eerst een land en tik dan de plek aan."
            selectie={landen}
            stijl="neutraal"
            laag={slot && !uitleg ? "landen" : null}
            onKies={slot && !uitleg ? leg : undefined}
            geplaatst={gelegd}
            toonDoel={uitleg && europa ? europa.doel : null}
          />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-center" aria-live="polite">
            {melding && (
              <p
                key={melding.tekst + gelegd.length}
                className={`mees-verschijn max-w-md rounded-full px-5 py-2.5 text-center font-bold shadow-zwevend ${melding.soort === "goed" ? "bg-succes-zacht text-succes" : "bg-probeer-opnieuw-zacht text-probeer-opnieuw"}`}
              >
                {melding.tekst}
              </p>
            )}
          </div>
        </div>
        <fieldset className="rounded-[16px] border border-[#d8e9f8] p-2">
          <legend className="px-1 font-bold">Kies een land</legend>
          <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 desktop:grid-cols-1">
            {tray.map((s) => {
              const v = vindVraag(s.vraagId);
              if (v?.soort !== "europa") return null;
              const land = landPerId.get(v.doel);
              const aan = s.id === slot?.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={aan}
                  onClick={() => {
                    setGekozenSlot(s.id);
                    setMelding(null);
                  }}
                  className={`flex min-h-14 items-center gap-2 rounded-[12px] border p-2 text-left ${aan ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-[#d8e9f8] hover:bg-blauw-zacht"}`}
                >
                  {land && (
                    <svg viewBox={viewBoxVan(land.bbox)} className="size-10 shrink-0" aria-hidden>
                      <path d={land.pad} fill={land.kleur} stroke="#66809e" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                    </svg>
                  )}
                  <span className="font-bold leading-tight">{v.doelNaam}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {europa && slot && (hints > 0 || uitleg) && (
        <div className="mt-3 rounded-[14px] bg-blauw-zacht p-4">
          {uitleg ? (
            <>
              <h4 className="font-bold text-actie-blauw">Uitleg</h4>
              <p className="mt-1 text-lg">
                <TekstMetBreuken tekst={europa.explanation} />
              </p>
              <p className="mt-2 font-bold">Het goede antwoord is {goedAntwoordTekst(europa)}. Kijk op de kaart waar het ligt.</p>
            </>
          ) : (
            <>
              <h4 className="font-bold text-actie-blauw">Hint {hints} van 2</h4>
              <p className="mt-1 text-lg">{europa.hints[hints - 1]}</p>
            </>
          )}
          <div className="mt-1">
            <VoorleesLink id={`puzzel-${slot.id}-${uitleg ? "u" : hints}`} tekst={uitleg ? uitlegVoorleesTekst(europa) : hintVoorleesTekst(europa, hints - 1)} />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {uitleg ? (
          <button type="button" onClick={legNaUitleg} className="inline-flex min-h-14 items-center gap-2 rounded-[14px] bg-actie-blauw px-6 text-lg font-bold text-wit hover:bg-actie-hover">
            Verder
            <Icoon naam="pijl-rechts" className="size-6" />
          </button>
        ) : (
          slot && (
            <button type="button" onClick={() => bewaar((d) => vraagHulp(d, sessie.id, slot.id))} className="inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht">
              <Icoon naam="hint" className="size-6" />
              {hints === 0 ? "Geef me een hint" : hints === 1 ? "Nog een hint" : "Laat zien waar het ligt"}
            </button>
          )
        )}
        {europa && <VoorleesLink id={`puzzel-vraag-${slot?.id}`} tekst={`Leg ${europa.doelNaam} op de juiste plek.`} />}
      </div>
    </div>
  );
}
