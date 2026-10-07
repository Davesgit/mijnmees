import type { ReactNode } from "react";
import { Icoon } from "./Icoon";

/** KeuzeKaart: een echte radio- of checkbox-control in kaartvorm (ontwerpregels §5). */
export function KeuzeKaart({
  naam,
  waarde,
  gekozen,
  onKies,
  titel,
  omschrijving,
  icoon,
  uitgeschakeld,
  reden,
}: {
  naam: string;
  waarde: string;
  gekozen: boolean;
  onKies: (waarde: string) => void;
  titel: string;
  omschrijving?: string;
  icoon?: ReactNode;
  uitgeschakeld?: boolean;
  reden?: string;
}) {
  return (
    <label
      className={`relative flex min-h-16 gap-3 rounded-[16px] border p-4 transition-colors duration-[120ms] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus tablet:p-5 ${
        uitgeschakeld
          ? "cursor-default border-rand-zacht bg-wit text-tekst-zacht"
          : gekozen
            ? "cursor-pointer border-2 border-actie-blauw bg-blauw-zacht p-[15px] tablet:p-[19px]"
            : "cursor-pointer border-rand-interactief bg-wit hover:bg-blauw-zacht"
      } ${icoon ? "items-center" : "items-start"}`}
    >
      <input
        type="radio"
        name={naam}
        value={waarde}
        checked={gekozen}
        disabled={uitgeschakeld}
        onChange={() => onKies(waarde)}
        className="sr-only"
        aria-describedby={reden ? `${naam}-${waarde}-reden` : undefined}
      />
      {icoon && <span className={uitgeschakeld ? "text-uitgeschakeld-tekst" : "text-actie-blauw"}>{icoon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold leading-snug">{titel}</span>
        {omschrijving && <span className="mt-0.5 block tekst-klein text-tekst-zacht">{omschrijving}</span>}
        {reden && (
          <span id={`${naam}-${waarde}-reden`} className="mt-0.5 block tekst-klein text-tekst-zacht">
            {reden}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${
          gekozen ? "border-actie-blauw bg-actie-blauw text-wit" : uitgeschakeld ? "border-uitgeschakeld-vlak" : "border-rand-interactief bg-wit"
        }`}
      >
        {gekozen && <Icoon naam="check" className="size-5" />}
      </span>
    </label>
  );
}

export function StapKop({ nummer, children, id }: { nummer: number; children: ReactNode; id: string }) {
  return (
    <legend id={id} className="mb-3 flex items-center gap-3 subtitel">
      <span className="grid size-10 place-items-center rounded-full bg-blauw-zacht text-lg font-extrabold text-actie-blauw" aria-hidden>
        {nummer}
      </span>
      {children}
    </legend>
  );
}
