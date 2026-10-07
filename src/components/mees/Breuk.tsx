import { Fragment } from "react";

const rangtelwoord: Record<number, string> = {
  2: "tweede", 3: "derde", 4: "vierde", 5: "vijfde", 6: "zesde", 7: "zevende", 8: "achtste",
  9: "negende", 10: "tiende", 11: "elfde", 12: "twaalfde", 15: "vijftiende", 16: "zestiende",
  18: "achttiende", 20: "twintigste", 24: "vierentwintigste", 30: "dertigste", 36: "zesendertigste",
  40: "veertigste", 45: "vijfenveertigste",
};

/** Gesproken vorm van een breuk, bijvoorbeeld "3 vierde". */
export function breukInWoorden(teller: number, noemer: number) {
  if (teller === 1 && noemer === 2) return "een half";
  return `${teller} ${rangtelwoord[noemer] ?? `gedeeld door ${noemer}`}`;
}

/** Vervangt "a/b" in een tekst door de gesproken vorm, voor voorlezen. */
export function tekstVoorVoorlezen(tekst: string) {
  return tekst
    .replace(/(\d+)\/(\d+)/g, (_, t, n) => breukInWoorden(Number(t), Number(n)))
    .replace(/ < /g, " is kleiner dan ")
    .replace(/ > /g, " is groter dan ")
    .replace(/ = /g, " is gelijk aan ");
}

/** Breuk als echte opgebouwde tekst (geen afbeelding), met gesproken alternatief. */
export function Breuk({ teller, noemer, className = "" }: { teller: number; noemer: number; className?: string }) {
  return (
    <span role="math" aria-label={breukInWoorden(teller, noemer)} className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span aria-hidden className="px-[0.12em]">{teller}</span>
      <span aria-hidden className="my-[0.12em] h-[0.09em] min-h-[2px] w-full rounded-full bg-current" />
      <span aria-hidden className="px-[0.12em]">{noemer}</span>
    </span>
  );
}

/** Kleine breuk in een lopende zin, bijvoorbeeld in hints en uitleg. */
function ZinBreuk({ teller, noemer }: { teller: number; noemer: number }) {
  return (
    <span role="math" aria-label={breukInWoorden(teller, noemer)} className="mx-[0.1em] inline-flex flex-col items-center align-middle text-[0.8em] font-bold leading-none">
      <span aria-hidden>{teller}</span>
      <span aria-hidden className="my-[2px] h-[2px] w-full rounded-full bg-current" />
      <span aria-hidden>{noemer}</span>
    </span>
  );
}

/** Toont tekst waarin breuken als "a/b" staan met opgebouwde breuken. */
export function TekstMetBreuken({ tekst }: { tekst: string }) {
  const delen = tekst.split(/(\d+\/\d+)/g);
  return (
    <>
      {delen.map((deel, i) => {
        const m = deel.match(/^(\d+)\/(\d+)$/);
        return m ? <ZinBreuk key={i} teller={Number(m[1])} noemer={Number(m[2])} /> : <Fragment key={i}>{deel}</Fragment>;
      })}
    </>
  );
}

/** Illustratie: twee breukkaartjes met een vergelijkingsteken (S01, S07). Wiskundig correct. */
export function BreukKaartjes({
  links,
  rechts,
  teken,
  klein = false,
}: {
  links: [number, number];
  rechts: [number, number];
  teken?: "<" | "=" | ">";
  klein?: boolean;
}) {
  const kaart = `grid place-items-center rounded-[14px] border border-rand-zacht bg-wit text-inkt shadow-[0_6px_16px_rgba(17,29,85,0.08)] ${
    klein ? "h-20 w-16 text-2xl" : "h-24 w-20 text-3xl tablet:h-28 tablet:w-24 tablet:text-4xl"
  }`;
  return (
    <div className="flex items-center gap-3 font-extrabold" aria-hidden>
      <div className={`${kaart} -rotate-6`}>
        <Breuk teller={links[0]} noemer={links[1]} />
      </div>
      {teken && <span className={klein ? "text-3xl" : "text-4xl tablet:text-5xl"}>{teken}</span>}
      <div className={`${kaart} rotate-6`}>
        <Breuk teller={rechts[0]} noemer={rechts[1]} />
      </div>
    </div>
  );
}
