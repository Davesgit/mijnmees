import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Basis = {
  children: ReactNode;
  className?: string;
  /** Grote variant voor hoofdacties (S01, S04). */
  groot?: boolean;
};

type AlsKnop = Basis & Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };
type AlsLink = Basis & { href: string; onClick?: () => void; "aria-label"?: string };

const basis =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full knoptekst transition-colors duration-[120ms] select-none disabled:cursor-default";

const stijlen = {
  primair:
    "bg-actie-blauw text-wit px-6 py-3 [@media(hover:hover)]:hover:bg-actie-hover active:bg-actie-ingedrukt disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst",
  secundair:
    "bg-wit text-actie-blauw border border-rand-interactief px-5 py-3 [@media(hover:hover)]:hover:bg-blauw-zacht active:bg-blauw-zacht active:border-actie-blauw disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst disabled:border-transparent",
  gevaar:
    "bg-fout text-wit px-6 py-3 [@media(hover:hover)]:hover:bg-[#991b1b] active:bg-[#7f1d1d] disabled:bg-uitgeschakeld-vlak disabled:text-uitgeschakeld-tekst",
  zacht:
    "bg-blauw-zacht text-inkt px-5 py-2.5 [@media(hover:hover)]:hover:bg-[#d9ecfd] active:bg-[#cfe6fc]",
  tekst:
    "text-actie-blauw px-2 rounded-[12px] [@media(hover:hover)]:hover:bg-blauw-zacht active:bg-blauw-zacht active:text-inkt",
};

function maakKnop(stijl: keyof typeof stijlen) {
  return function Knop(props: AlsKnop | AlsLink) {
    const { children, className = "", groot, ...rest } = props;
    const klassen = `${basis} ${stijlen[stijl]} ${groot ? "min-h-14 px-8 text-[1.125rem]" : ""} ${className}`;
    if ("href" in rest && rest.href !== undefined) {
      const { href, ...linkRest } = rest as AlsLink;
      return (
        <Link href={href} className={klassen} {...linkRest}>
          {children}
        </Link>
      );
    }
    const knopProps = rest as Omit<AlsKnop, keyof Basis>;
    return (
      <button type="button" className={klassen} {...knopProps}>
        {children}
      </button>
    );
  };
}

export const PrimaireKnop = maakKnop("primair");
export const SecundaireKnop = maakKnop("secundair");
export const ZachteKnop = maakKnop("zacht");
export const GevaarKnop = maakKnop("gevaar");
export const TekstKnop = maakKnop("tekst");
