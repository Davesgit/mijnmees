"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Icoon } from "./Icoon";

/** InvoerVeld: label boven, rand-interactief, fout met icoon + tekst via aria-describedby (ontwerpregels §5). */
export function InvoerVeld({
  label,
  fout,
  hulp,
  type = "text",
  ...rest
}: { label: string; fout?: string; hulp?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [zichtbaar, setZichtbaar] = useState(false);
  const isWachtwoord = type === "password";
  const beschrijving = [fout ? `${id}-fout` : null, hulp ? `${id}-hulp` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isWachtwoord && zichtbaar ? "text" : type}
          aria-invalid={fout ? true : undefined}
          aria-describedby={beschrijving}
          className={`min-h-12 w-full rounded-[12px] border bg-wit px-4 py-3 text-lg text-inkt placeholder:text-[#7d8aa6] hover:border-actie-blauw ${
            fout ? "border-2 border-fout" : "border-rand-interactief"
          } ${isWachtwoord ? "pr-24" : ""}`}
          {...rest}
        />
        {isWachtwoord && (
          <button
            type="button"
            onClick={() => setZichtbaar((z) => !z)}
            aria-pressed={zichtbaar}
            className="absolute inset-y-0 right-1 my-auto inline-flex h-11 items-center gap-1 rounded-[10px] px-3 text-base font-semibold text-actie-blauw hover:bg-blauw-zacht"
          >
            {zichtbaar ? "Verberg" : "Toon"}
            <span className="sr-only"> wachtwoord</span>
          </button>
        )}
      </div>
      {hulp && (
        <p id={`${id}-hulp`} className="tekst-klein text-tekst-zacht">
          {hulp}
        </p>
      )}
      {fout && (
        <p id={`${id}-fout`} className="flex items-start gap-2 tekst-klein font-semibold text-fout">
          <Icoon naam="fout" className="mt-0.5 size-5" />
          {fout}
        </p>
      )}
    </div>
  );
}

export function Vinkje({ naam, children, fout, defaultChecked }: { naam: string; children: ReactNode; fout?: string; defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[12px] p-1">
        <input
          type="checkbox"
          name={naam}
          defaultChecked={defaultChecked}
          aria-invalid={fout ? true : undefined}
          aria-describedby={fout ? `${id}-fout` : undefined}
          className="mt-0.5 size-6 shrink-0 accent-actie-blauw"
        />
        <span>{children}</span>
      </label>
      {fout && (
        <p id={`${id}-fout`} className="flex items-start gap-2 tekst-klein font-semibold text-fout">
          <Icoon naam="fout" className="mt-0.5 size-5" />
          {fout}
        </p>
      )}
    </div>
  );
}

/** Schakelaar als echte checkbox met switch-rol. */
export function Schakelaar({
  label,
  uitleg,
  aan,
  onWijzig,
  naam,
  uitgeschakeld,
}: {
  label: string;
  uitleg?: string;
  aan: boolean;
  onWijzig?: (aan: boolean) => void;
  naam?: string;
  uitgeschakeld?: boolean;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block font-bold">{label}</span>
        {uitleg && <span className="block tekst-klein text-tekst-zacht">{uitleg}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        name={naam}
        checked={aan}
        disabled={uitgeschakeld}
        onChange={(e) => onWijzig?.(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-8 w-14 shrink-0 rounded-full bg-[#b9c6d8] transition-colors peer-checked:bg-actie-blauw peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus peer-disabled:opacity-60 after:absolute after:left-1 after:top-1 after:size-6 after:rounded-full after:bg-wit after:transition-transform peer-checked:after:translate-x-6"
      />
    </label>
  );
}

export type FormStatus = { fouten?: Record<string, string>; melding?: string; gelukt?: boolean; waarden?: Record<string, string> };
