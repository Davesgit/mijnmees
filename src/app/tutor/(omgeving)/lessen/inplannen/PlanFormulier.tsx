"use client";

import { useActionState, useState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { InvoerVeld, type FormStatus } from "@/components/mees/Formulier";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { lesConfig } from "@/features/live/regels";
import { planLesActie } from "@/app/tutor/les-acties";

export function PlanFormulier({ leerdoelId, leerdoel, aantal }: { leerdoelId: string; leerdoel: string; aantal: number }) {
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(planLesActie, {});
  const f = status.fouten ?? {};
  const w = status.waarden ?? {};
  const [titel, setTitel] = useState(w.titel ?? `Een les over ${leerdoel.toLowerCase()}`);
  const [start, setStart] = useState(w.start ?? "");
  const [duur, setDuur] = useState(Number(w.duur) || 20);
  const [voorbeeld, setVoorbeeld] = useState(false);
  const datum = start ? new Date(`${start}:00`).toLocaleString("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "…";

  return (
    <form action={actie} className="flex flex-col gap-5">
      <input type="hidden" name="leerdoelId" value={leerdoelId} />
      {status.melding && <Melding soort="fout">{status.melding}</Melding>}
      <InvoerVeld label="Titel" name="titel" value={titel} onChange={(e) => setTitel(e.target.value)} maxLength={120} fout={f.titel} hulp="Zonder namen. Kinderen en ouders zien deze titel." />
      <div className="grid gap-5 tablet:grid-cols-2">
        <InvoerVeld label="Datum en tijd (Nederlandse tijd)" name="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} fout={f.start} required />
        <label className="flex flex-col gap-2 font-bold">
          Duur
          <select name="duur" value={duur} onChange={(e) => setDuur(Number(e.target.value))} className="min-h-12 rounded-[12px] border border-rand-interactief bg-wit px-3 font-normal">
            {[15, 20, 25, 30].map((m) => (
              <option key={m} value={m}>
                {m} minuten
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-5 tablet:grid-cols-2">
        <InvoerVeld label="Aantal plekken" name="capaciteit" type="number" min={1} max={lesConfig.maxCapaciteit} defaultValue={w.capaciteit ?? String(lesConfig.standaardCapaciteit)} fout={f.capaciteit} />
        <label className="flex min-h-12 items-start gap-3 self-end rounded-[12px] p-1">
          <input type="checkbox" name="opnemen" defaultChecked className="mt-0.5 size-6 shrink-0 accent-actie-blauw" />
          <span>
            <span className="block font-bold">Les opnemen</span>
            <span className="block tekst-klein text-tekst-zacht">Alleen jouw stem en het bord. Na controle kunnen uitgenodigde kinderen de les terugkijken.</span>
          </span>
        </label>
      </div>
      <Melding>
        {aantal} kinderen krijgen een uitnodiging. Hun ouders geven eerst toestemming. Kinderen zien elkaar niet en hun vragen gaan alleen naar jou.
      </Melding>

      <SecundaireKnop onClick={() => setVoorbeeld((v) => !v)} aria-expanded={voorbeeld} className="self-start">
        Bekijk uitnodiging
      </SecundaireKnop>
      {voorbeeld && (
        <section aria-label="Voorbeeld van de uitnodiging" className="rounded-[16px] border-2 border-dashed border-rand-interactief bg-wit p-5">
          <p className="tekst-klein font-semibold text-tekst-zacht">Zo ziet een kind de uitnodiging</p>
          <h2 className="mt-1 subtitel">{titel || "…"}</h2>
          <p className="mt-1">
            {datum} · {duur} minuten
          </p>
          <p className="mt-2 text-tekst-zacht">Je ziet en hoort de tutor. Je vragen gaan alleen naar de tutor.</p>
        </section>
      )}

      <PrimaireKnop type="submit" groot disabled={bezig} className="w-full tablet:w-auto tablet:self-start">
        {bezig ? "Even wachten…" : "Plan en verstuur"}
        {!bezig && <Icoon naam="pijl-rechts" />}
      </PrimaireKnop>
    </form>
  );
}
