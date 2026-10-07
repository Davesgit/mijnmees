import type { ReactNode } from "react";
import { Mees, type MeesPose } from "./Mees";

/** Gecentreerd kader voor korte formulieren (inloggen, herstel, ontgrendelen). */
export function SmalKader({ titel, ondertitel, pose = "blij", children }: { titel: string; ondertitel?: string; pose?: MeesPose; children: ReactNode }) {
  return (
    <div className="mees-content flex flex-col items-center py-10 tablet:py-14">
      <div className="w-full max-w-[34rem]">
        <div className="flex flex-col items-center text-center">
          <Mees pose={pose} breedte={130} prioriteit className="w-28 tablet:w-32" />
          <h1 className="mt-4 titel-held">{titel}</h1>
          {ondertitel && <p className="mt-2 tekst-intro text-tekst-zacht">{ondertitel}</p>}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
