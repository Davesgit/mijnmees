"use client";

import { Icoon } from "@/components/mees/Icoon";
import { wisKindprofielenOpApparaat } from "@/lib/opslag/lokaal";
import { uitloggen } from "./acties";

/** Uitloggen; op een gedeeld apparaat verdwijnen ook de lokale kopieën van de kinderprofielen. */
export function UitlogKnop({ overal = false, label }: { overal?: boolean; label?: string }) {
  return (
    <form
      action={uitloggen}
      onSubmit={() => {
        wisKindprofielenOpApparaat();
      }}
    >
      <input type="hidden" name="overal" value={overal ? "ja" : "nee"} />
      <button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht">
        <Icoon naam="uitloggen" />
        {label ?? "Uitloggen op dit apparaat"}
      </button>
    </form>
  );
}
