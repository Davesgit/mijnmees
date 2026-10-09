"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { landPerId, viewBoxVan } from "@/features/europa/kaart";
import { KaartVlak, type KaartLaag } from "@/features/europa/KaartVlak";
import { legPuzzelstukNaUitleg, registreerAntwoord, rondOvergangAf, sessieRoute, vraagHulp, werkPuzzelBij } from "@/features/oefenen/sessie";
import type { Sessie, Slot } from "@/features/oefenen/types";
import { FeedbackEnHulp, oefenTeksten, OefenBediening, OefenKop, useVraagplaats, VraagTitel, type Feedback } from "@/features/oefenen/ui/Oefenkader";
import { vindVraag, type EuropaVraag } from "@/features/oefenen/vragen";
import { haalOpslag, useOpslag, wijzigOpslag } from "@/lib/opslag/lokaal";

export function EuropaScherm({ sessieId }: { sessieId: string }) {
  const router = useRouter();
  const opslag = useOpslag();
  const sessie = opslag?.sessies[sessieId];

  useEffect(() => {
    if (sessie?.status === "bezig" && sessie.soort === "europa" && sessie.slots[sessie.index]?.uitkomst) wijzigOpslag((d) => rondOvergangAf(d, sessieId));
    // Alleen bij openen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessie?.status === "afgerond") router.replace(sessieRoute(sessie));
  }, [sessie, router]);

  if (opslag === null) return <Laden />;
  if (!sessie || (sessie.soort !== "europa" && sessie.soort !== "puzzel")) {
    return (
      <div className="mees-content py-10">
        <h1 className="titel-pagina">Europa</h1>
        <Melding className="mt-6">
          Er is geen kaartselectie.{" "}
          <Link href="/kind/aardrijkskunde/europa" className="font-bold text-actie-blauw underline underline-offset-4">
            Stel je oefening samen
          </Link>
        </Melding>
      </div>
    );
  }
  if (sessie.status === "afgerond") return <Laden />;
  if (sessie.soort === "puzzel") return <Puzzel sessie={sessie} />;

  const slot = sessie.slots[sessie.index];
  const vraag = slot ? vindVraag(slot.vraagId) : null;
  if (!slot || vraag?.soort !== "europa") return <Laden />;
  return <EuropaVraagplaats key={slot.id} sessie={sessie} slot={slot} vraag={vraag} rustigVerder={opslag.instellingen.rustigVerder} />;
}

function voortgangEuropa(sessie: Sessie) {
  const uniek = sessie.slots.filter((s) => !s.herhalingVan);
  const behandeld = uniek.filter((s) => s.uitkomst).length;
  return { label: `${behandeld} van ${uniek.length} onderdelen behandeld`, aantal: uniek.length, afgehandeld: behandeld };
}

function laagVoor(vraag: EuropaVraag): KaartLaag | null {
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

const terug = { href: "/kind/aardrijkskunde/europa", kort: "Europa", lang: "Europa" };

function EuropaVraagplaats({ sessie, slot, vraag, rustigVerder }: { sessie: Sessie; slot: Slot; vraag: EuropaVraag; rustigVerder: boolean }) {
  const v = useVraagplaats({ sessie, slot, rustigVerder });
  const landen = sessie.instellingen?.landen ?? [];
  const laag = laagVoor(vraag);
  const opties = vraag.opties ?? slot.opties ?? [];
  const uitleg = slot.hulp.uitleg && !slot.uitkomst;
  const isLigging = vraag.module === "relative";

  return (
    <div className="flex flex-1 flex-col">
      <div className="mees-content flex flex-1 flex-col pt-4 tablet:max-w-[1200px] tablet:pt-6">
        <OefenKop terug={terug} voortgang={voortgangEuropa(sessie)} onStop={v.stop} onTerug={v.stopOvergang} />
        <section aria-labelledby="vraag-titel" className="flex flex-1 flex-col items-center py-3 text-center tablet:py-4">
          <KaartVlak
            className="h-[clamp(280px,calc(100dvh-27rem),900px)] tablet:h-[clamp(320px,calc(100dvh-26rem),900px)] w-full"
            label={vraag.type === "map-click" ? "Kaart van Europa. Tik een plek aan." : "Kaart van Europa."}
            selectie={landen}
            stijl={vraag.type === "map-click" && vraag.module === "countries" ? "gekleurd" : "neutraal"}
            laag={v.vergrendeld ? null : laag}
            gekozen={vraag.type === "map-click" ? v.gekozen : null}
            onKies={laag && !v.vergrendeld ? (id) => v.kies(id) : undefined}
            markering={vraag.markering ?? (isLigging ? vraag.referentie : null)}
            donker={isLigging ? opties.map((o) => o.id).filter((id) => landPerId.has(id)) : []}
            goed={v.klaar && vraag.type === "map-click" ? vraag.doel : null}
            toonDoel={uitleg && vraag.type === "map-click" ? vraag.doel : null}
          />
          {/* De vraag staat direct onder de kaart (ontwerpregels §6), zonder landen af te dekken. */}
          <div className="mt-3 w-full max-w-2xl">
            <VraagTitel titelRef={v.titelRef} vraag={vraag.prompt} instructie={vraag.instructie} klein />
            {vraag.type === "map-click" && (
              <p className="mt-1 tekst-klein font-semibold text-actie-blauw" aria-live="polite">
                {v.gekozen ? "Je hebt een plek gekozen." : "Nog geen plek gekozen."}
              </p>
            )}
          </div>
          {vraag.type === "map-click" ? null : (
            <fieldset className="mt-4 w-full" disabled={v.vergrendeld}>
              <legend className="mb-2 tekst-klein text-tekst-zacht">Kies één antwoord.</legend>
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 desktop:grid-cols-4">
                {opties.map((o) => {
                  const gekozen = v.gekozen === o.id;
                  const isGoed = v.klaar && o.id === vraag.doel;
                  return (
                    <label
                      key={o.id}
                      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[16px] border px-4 text-left text-lg font-bold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus ${
                        isGoed ? "border-2 border-succes bg-succes-zacht" : gekozen ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-rand-interactief bg-wit hover:bg-blauw-zacht"
                      }`}
                    >
                      <input type="radio" name="antwoord" value={o.id} checked={gekozen} onChange={() => v.kies(o.id)} className="sr-only" />
                      <span aria-hidden className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${gekozen ? "border-actie-blauw bg-actie-blauw" : "border-rand-interactief"}`}>
                        {gekozen && <span className="size-2.5 rounded-full bg-wit" />}
                      </span>
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
          <FeedbackEnHulp feedback={v.feedback} slot={slot} vraag={vraag} bewaarFout={v.bewaarFout} />
        </section>
      </div>
      <OefenBediening
        slot={slot}
        vergrendeld={v.vergrendeld}
        klaar={v.klaar}
        uitlegZichtbaar={v.uitlegZichtbaar}
        laatste={sessie.index === sessie.slots.length - 1}
        kanControleren={Boolean(v.gekozen)}
        kiesEerst={vraag.type === "map-click" ? "Tik eerst een plek aan." : "Kies eerst een antwoord."}
        voorleesTekst={`${vraag.prompt} ${vraag.type === "choice" ? opties.map((o) => o.label).join(", ") : ""}`}
        onHulp={v.hulp}
        onControleer={() => v.controleer()}
        onVolgende={v.volgende}
      />
    </div>
  );
}

/** Landenpuzzel: kies een stukje, tik daarna de plek op de kaart aan. Slepen is niet nodig. */
function Puzzel({ sessie }: { sessie: Sessie }) {
  const router = useRouter();
  const landen = sessie.instellingen?.landen ?? [];
  const open = sessie.slots.filter((s) => !s.uitkomst);
  const gelegd = sessie.slots.filter((s) => s.uitkomst).map((s) => vindVraag(s.vraagId)).filter((v): v is EuropaVraag => v?.soort === "europa").map((v) => v.doel);
  const [gekozenSlot, setGekozenSlot] = useState<string | null>(open[0]?.id ?? null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [bewaarFout, setBewaarFout] = useState(false);

  const slot = sessie.slots.find((s) => s.id === gekozenSlot && !s.uitkomst) ?? null;
  const vraag = slot ? vindVraag(slot.vraagId) : null;

  function bewaar(w: Parameters<typeof wijzigOpslag>[0]) {
    setBewaarFout(!wijzigOpslag(w));
  }

  function naKlaar() {
    bewaar((d) => werkPuzzelBij(d, sessie.id));
    const na = haalOpslag().sessies[sessie.id];
    if (na?.status === "afgerond") router.push(sessieRoute(na));
  }

  function kiesStuk(id: string) {
    setGekozenSlot(id);
    setFeedback(null);
  }

  function leg(landId: string) {
    if (!slot || slot.hulp.uitleg) return;
    let beoordeling: "goed" | "fout" | null = null;
    bewaar((d) => {
      const r = registreerAntwoord(d, sessie.id, landId, { slotId: slot.id });
      if (!r) return d;
      beoordeling = r.beoordeling;
      return r.data;
    });
    const na = haalOpslag().sessies[sessie.id]?.slots.find((s) => s.id === slot.id);
    if (beoordeling === "goed") {
      setFeedback({ soort: "goed", tekst: na?.uitkomst === "zelfstandig" ? oefenTeksten.goed : oefenTeksten.goedMetHulp });
      const volgende = haalOpslag().sessies[sessie.id]?.slots.find((s) => !s.uitkomst);
      setGekozenSlot(volgende?.id ?? null);
      naKlaar();
    } else if (beoordeling === "fout" && na) {
      const f = na.hulp.fouten;
      setFeedback({ soort: "fout", tekst: f >= 4 ? oefenTeksten.uitleg : f === 3 ? oefenTeksten.hintTwee : f === 2 ? oefenTeksten.hintEen : oefenTeksten.eersteFout });
    }
  }

  function legNaUitleg() {
    if (!slot) return;
    bewaar((d) => legPuzzelstukNaUitleg(d, sessie.id, slot.id));
    const volgende = haalOpslag().sessies[sessie.id]?.slots.find((s) => !s.uitkomst);
    setGekozenSlot(volgende?.id ?? null);
    setFeedback(null);
    naKlaar();
  }

  function stop() {
    router.push("/kind/start");
  }

  const tray = open.slice(0, 5);
  const uitleg = Boolean(slot?.hulp.uitleg);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mees-content flex flex-1 flex-col pt-4 tablet:max-w-[1280px] tablet:pt-6">
        <OefenKop
          terug={terug}
          voortgang={{ label: `${gelegd.length} van ${sessie.slots.length} landen geplaatst`, aantal: sessie.slots.length, afgehandeld: gelegd.length }}
          onStop={stop}
        />
        <section aria-labelledby="puzzel-titel" className="flex flex-1 flex-col py-3 text-center tablet:py-4">
          <div className="grid gap-4 landscape:tablet:grid-cols-[1fr_16rem] desktop:grid-cols-[1fr_17rem]">
            <div className="flex min-w-0 flex-col">
            <KaartVlak
              className="h-[clamp(280px,calc(100dvh-27rem),900px)] tablet:h-[clamp(320px,calc(100dvh-26rem),900px)] w-full"
              label="Kaart van Europa. Kies eerst een land en tik dan de plek aan."
              selectie={landen}
              stijl="neutraal"
              laag={slot && !uitleg ? "landen" : null}
              onKies={slot && !uitleg ? leg : undefined}
              geplaatst={gelegd}
              toonDoel={uitleg && vraag?.soort === "europa" ? vraag.doel : null}
            />
            {/* Titel onder de kaart: dekt geen landen af. */}
            <div className="mt-3">
              <h1 id="puzzel-titel" className="subtitel tablet:text-[1.75rem] tablet:font-extrabold">
                Leg de landen op hun plek
              </h1>
              <p className="mt-1 tekst-klein text-[#5b6fae]">Tik een land aan en tik daarna op de kaart.</p>
            </div>
            </div>
            <fieldset className="rounded-[20px] border border-rand-zacht bg-wit p-3 text-left">
              <legend className="sr-only">Kies een land</legend>
              <p className="px-1 pb-2 font-bold">Kies een land</p>
              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 landscape:tablet:grid-cols-1 desktop:grid-cols-1">
                {tray.map((s, i) => {
                  const v = vindVraag(s.vraagId);
                  if (v?.soort !== "europa") return null;
                  const land = landPerId.get(v.doel);
                  const gekozen = s.id === gekozenSlot;
                  return (
                    <label
                      key={s.id}
                      className={`${i >= 3 ? "max-[419px]:hidden tablet:flex" : "flex"} min-h-16 cursor-pointer items-center gap-3 rounded-[14px] border p-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                        gekozen ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-rand-zacht hover:bg-blauw-zacht"
                      }`}
                    >
                      <input type="radio" name="stuk" className="sr-only" checked={gekozen} onChange={() => kiesStuk(s.id)} />
                      {land && (
                        <svg viewBox={viewBoxVan(land.bbox)} className="size-12 shrink-0" aria-hidden>
                          <path d={land.pad} fill={land.kleur} stroke="#66809e" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                        </svg>
                      )}
                      <span className="font-bold">{v.doelNaam}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 px-1 tekst-klein text-tekst-zacht">Na het plaatsen verschijnt een nieuw stukje.</p>
            </fieldset>
          </div>
          <div className="mx-auto w-full max-w-[1000px]">
            {slot && vraag ? (
              <FeedbackEnHulp feedback={feedback} slot={slot} vraag={vraag} bewaarFout={bewaarFout} />
            ) : (
              feedback && (
                <div className="mt-4 text-left" aria-live="polite">
                  <Melding soort="succes" className="mx-auto max-w-xl font-bold">
                    {feedback.tekst}
                  </Melding>
                </div>
              )
            )}
          </div>
        </section>
      </div>
      {slot && vraag ? (
        <OefenBediening
          slot={slot}
          vergrendeld={false}
          klaar={false}
          uitlegZichtbaar={uitleg}
          laatste={open.length === 1}
          kanControleren={false}
          kiesEerst=""
          voorleesTekst={`Leg ${vraag.soort === "europa" ? vraag.doelNaam : ""} op de juiste plek.`}
          onHulp={() => bewaar((d) => vraagHulp(d, sessie.id, slot.id))}
          onControleer={() => {}}
          onVolgende={legNaUitleg}
          controleerLabel={`${vraag.soort === "europa" ? vraag.doelNaam : "Land"} gekozen`}
        />
      ) : (
        <div className="sticky bottom-0 border-t border-rand-zacht bg-wit p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
          <PrimaireKnop onClick={naKlaar}>
            Verder
            <Icoon naam="pijl-rechts" />
          </PrimaireKnop>
        </div>
      )}
    </div>
  );
}

