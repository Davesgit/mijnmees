"use client";

import { useFormStatus } from "react-dom";
import { Icoon } from "@/components/mees/Icoon";
import { Avatar } from "@/components/mees/Profiel";
import type { AvatarId } from "@/lib/kinderen";

/** Profielkaart: direct zichtbaar gekozen (rand, vinkje, "Even wachten…") terwijl het profiel opent. */
export function ProfielKnop({ voornaam, avatar }: { voornaam: string; avatar: AvatarId }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-busy={pending || undefined}
      className={`flex w-full flex-col items-center gap-3 rounded-[16px] border p-4 transition-[colors,transform] duration-100 active:scale-[0.97] tablet:gap-4 tablet:p-8 ${
        pending ? "border-actie-blauw bg-blauw-zacht shadow-[0_0_0_3px_var(--color-actie-blauw)]" : "border-rand-zacht bg-wit hover:border-actie-blauw hover:bg-blauw-zacht"
      }`}
    >
      <Avatar id={avatar} className="size-24 tablet:size-36" />
      <span className="subtitel">{voornaam}</span>
      <span className={`grid size-12 place-items-center rounded-full ${pending ? "bg-actie-blauw text-wit" : "bg-blauw-zacht text-actie-blauw"}`} aria-hidden>
        <Icoon naam={pending ? "check" : "pijl-rechts"} />
      </span>
      <span className={`tekst-klein font-semibold text-actie-blauw ${pending ? "" : "invisible"}`} aria-live="polite">
        {pending ? `Hoi ${voornaam}! Even wachten…` : " "}
      </span>
    </button>
  );
}
