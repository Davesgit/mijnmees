"use client";

import { useState } from "react";
import { avatars, groepen } from "@/lib/kinderen";
import { Icoon } from "./Icoon";
import { Avatar } from "./Profiel";

function Fout({ tekst }: { tekst?: string }) {
  if (!tekst) return null;
  return (
    <p className="mt-2 flex items-start gap-2 tekst-klein font-semibold text-fout">
      <Icoon naam="fout" className="mt-0.5 size-5" />
      {tekst}
    </p>
  );
}

/** Groep 5–8 als segment met echte radioknoppen. */
export function GroepKiezer({ standaard, fout }: { standaard: number; fout?: string }) {
  const [gekozen, setGekozen] = useState(standaard);
  return (
    <fieldset>
      <legend className="mb-2 font-bold">Groep</legend>
      <div className="grid max-w-md grid-cols-4 overflow-hidden rounded-[12px] border border-rand-interactief">
        {groepen.map((g) => (
          <label
            key={g}
            className={`grid min-h-12 cursor-pointer place-items-center border-l border-rand-zacht text-lg font-bold first:border-l-0 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:-outline-offset-4 has-[:focus-visible]:outline-focus ${
              gekozen === g ? "bg-blauw-zacht text-actie-blauw shadow-[inset_0_0_0_2px_var(--color-actie-blauw)]" : "bg-wit hover:bg-blauw-zacht"
            }`}
          >
            <input type="radio" name="groep" value={g} checked={gekozen === g} onChange={() => setGekozen(g)} className="sr-only" />
            {g}
          </label>
        ))}
      </div>
      <p className="mt-2 tekst-klein text-tekst-zacht">Mees is er voor groep 5 tot en met 8. Eerdere leerdoelen blijven beschikbaar.</p>
      <Fout tekst={fout} />
    </fieldset>
  );
}

/** Keuze uit de zes dieren; nooit een foto. */
export function AvatarKiezer({ standaard, fout, naam = "avatar" }: { standaard: string; fout?: string; naam?: string }) {
  const [gekozen, setGekozen] = useState(standaard);
  return (
    <fieldset>
      <legend className="mb-3 font-bold">Kies een dier</legend>
      <div className="flex flex-wrap gap-3">
        {avatars.map((a) => (
          <label
            key={a.id}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-[16px] p-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
              gekozen === a.id ? "bg-blauw-zacht" : "hover:bg-blauw-zacht"
            }`}
          >
            <input type="radio" name={naam} value={a.id} checked={gekozen === a.id} onChange={() => setGekozen(a.id)} className="sr-only" />
            <span className={`relative rounded-full ${gekozen === a.id ? "ring-3 ring-actie-blauw ring-offset-2" : ""}`}>
              <Avatar id={a.id} className="size-16 tablet:size-20" />
              {gekozen === a.id && (
                <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-actie-blauw text-wit" aria-hidden>
                  <Icoon naam="check" className="size-5" />
                </span>
              )}
            </span>
            <span className="font-semibold">{a.naam}</span>
          </label>
        ))}
      </div>
      <Fout tekst={fout} />
    </fieldset>
  );
}
