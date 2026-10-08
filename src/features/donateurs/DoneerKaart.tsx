"use client";

import { useState } from "react";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";

const bedragen = [10, 25, 50] as const;

/** Bedrag kiezen. Echte betalingen zijn nog niet aangesloten: de knop zegt dat eerlijk, er wordt niets betaald. */
export function DoneerKaart() {
  const [frequentie, setFrequentie] = useState<"eenmalig" | "maandelijks">("eenmalig");
  const [bedrag, setBedrag] = useState<number | "anders">(25);
  const [ander, setAnder] = useState("");
  const [melding, setMelding] = useState(false);

  const anderBedrag = Number(ander.replace(",", "."));
  const anderGeldig = /^\d{1,6}([.,]\d{1,2})?$/.test(ander.trim()) && anderBedrag >= 1 && anderBedrag <= 100000;
  const tekstBedrag = bedrag === "anders" ? (anderGeldig ? `€ ${ander.trim()}` : "") : `€ ${bedrag}`;
  const knop = `w-full min-h-12 whitespace-nowrap rounded-[12px] border px-2 font-bold transition-colors`;

  return (
    <section id="doneren" aria-labelledby="doneren-kop" className="scroll-mt-24 rounded-[20px] border border-rand-zacht bg-wit p-5 tablet:p-6">
      <h2 id="doneren-kop" className="subtitel">
        Direct iets bijdragen
      </h2>
      <p className="mt-1 text-tekst-zacht">Elke bijdrage is welkom.</p>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-rand-zacht p-1" role="group" aria-label="Hoe vaak">
        {(["eenmalig", "maandelijks"] as const).map((f) => (
          <button key={f} type="button" aria-pressed={frequentie === f} onClick={() => setFrequentie(f)} className={`min-h-12 rounded-full font-bold ${frequentie === f ? "bg-actie-blauw text-wit" : "text-inkt hover:bg-blauw-zacht"}`}>
            {f === "eenmalig" ? "Eenmalig" : "Maandelijks"}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 desktop:grid-cols-4" role="group" aria-label="Bedrag">
        {bedragen.map((b) => (
          <button key={b} type="button" aria-pressed={bedrag === b} onClick={() => setBedrag(b)} className={`${knop} ${bedrag === b ? "border-actie-blauw bg-actie-blauw text-wit" : "border-rand-interactief bg-wit hover:bg-blauw-zacht"}`}>
            € {b}
          </button>
        ))}
        <button type="button" aria-pressed={bedrag === "anders"} onClick={() => setBedrag("anders")} className={`${knop} ${bedrag === "anders" ? "border-actie-blauw bg-actie-blauw text-wit" : "border-rand-interactief bg-wit hover:bg-blauw-zacht"}`}>
          Ander bedrag
        </button>
      </div>
      {bedrag === "anders" && (
        <label className="mt-3 flex flex-col gap-1 font-semibold">
          Jouw bedrag in euro
          <input inputMode="decimal" value={ander} onChange={(e) => setAnder(e.target.value)} placeholder="Bijvoorbeeld 15" aria-invalid={ander !== "" && !anderGeldig ? true : undefined} className="min-h-12 rounded-[12px] border border-rand-interactief px-3 font-normal" />
          {ander !== "" && !anderGeldig && <span className="tekst-klein text-fout">Vul een bedrag in tussen € 1 en € 100.000, met hoogstens twee cijfers achter de komma.</span>}
        </label>
      )}

      <PrimaireKnop className="mt-4 w-full" onClick={() => setMelding(true)} disabled={bedrag === "anders" && !anderGeldig} aria-controls="doneren-melding">
        Doneer {tekstBedrag} {frequentie === "maandelijks" ? "per maand" : ""}
        <Icoon naam="pijl-rechts" />
      </PrimaireKnop>
      <div id="doneren-melding" aria-live="polite">
        {melding ? (
          <p className="mt-3 rounded-[12px] bg-blauw-zacht p-3 tekst-klein">
            <strong>Doneren kan binnenkort.</strong> We zetten betalen pas aan als de stichting en een beveiligde betaalpagina geregeld zijn. Er is niets betaald. Wil je Mees nu al steunen? <a href="#aanmelden" className="font-bold text-actie-blauw underline underline-offset-4">Meld je aan</a>, dan nemen we contact op.
          </p>
        ) : (
          <p className="mt-2 text-center tekst-klein text-tekst-zacht">Straks via een beveiligde betaalpagina.</p>
        )}
      </div>
    </section>
  );
}
