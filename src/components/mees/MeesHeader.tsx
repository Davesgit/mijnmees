"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { wisGastgegevens } from "@/lib/opslag/lokaal";
import { Icoon, type AlleIcoonNamen } from "./Icoon";
import { Logo } from "./Mees";
import { Dialoog } from "./Dialoog";
import { PrimaireKnop, SecundaireKnop } from "./Knoppen";
import { Avatar, useProfiel } from "./Profiel";
import { useSyncStatus } from "@/lib/opslag/sync";

type NavItem = { label: string; href: string; icoon: AlleIcoonNamen; actief: (pad: string) => boolean };

export const kindNavigatie: NavItem[] = [
  {
    label: "Start",
    href: "/kind/start",
    icoon: "huis",
    actief: (p) => !p.startsWith("/kind/voortgang") && !p.startsWith("/kind/weetjes"),
  },
  { label: "Voortgang", href: "/kind/voortgang", icoon: "voortgang", actief: (p) => p.startsWith("/kind/voortgang") },
  { label: "Weetjesboek", href: "/kind/weetjesboek", icoon: "weetjesboek", actief: (p) => p.startsWith("/kind/weetjes") },
];

/** Tijdens een actieve oefening geen globale onderste navigatie op telefoon (ontwerpregels §6). */
export function isOefenRoute(pad: string) {
  return pad.startsWith("/kind/oefenen/");
}

export function MeesHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rand-zacht bg-wit/95 backdrop-blur supports-[backdrop-filter]:bg-wit/85">
      <a
        href="#inhoud"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-wit focus:px-4 focus:py-3 focus:text-actie-blauw"
      >
        Naar de inhoud
      </a>
      <div className="mees-content flex h-16 items-center gap-6 tablet:h-[72px] desktop:h-20">
        <Link href="/kind/start" className="-ml-1 rounded-[12px] p-1" aria-label="Mees, naar start">
          <Logo />
        </Link>

        <nav aria-label="Hoofdmenu" className="hidden h-full tablet:block">
          <Suspense fallback={<NavLijst pad="" />}>
            <ActieveNavLijst />
          </Suspense>
        </nav>

        <div className="ml-auto flex items-center gap-3 desktop:gap-5">
          <span className="hidden h-8 w-px bg-rand-zacht desktop:block" aria-hidden />
          <VoorOudersLink />
          <span className="hidden h-8 w-px bg-rand-zacht desktop:block" aria-hidden />
          <ProfielMenu />
        </div>
      </div>
    </header>
  );
}

function VoorOudersLink() {
  const { ouderIngelogd } = useProfiel();
  return (
    <Link
      href={ouderIngelogd ? "/ouder" : "/"}
      className="hidden min-h-12 items-center gap-2 rounded-[12px] px-2 text-base font-semibold text-tekst-zacht hover:text-actie-blauw desktop:flex"
    >
      {ouderIngelogd && <Icoon naam="slot" className="size-5" />}
      Voor ouders
    </Link>
  );
}

function ActieveNavLijst() {
  return <NavLijst pad={usePathname()} />;
}

function NavLijst({ pad }: { pad: string }) {
  return (
    <ul className="flex h-full items-stretch gap-1 desktop:gap-4">
      {kindNavigatie.map((item) => {
        const actief = pad !== "" && item.actief(pad);
        return (
          <li key={item.href} className="flex">
            <Link
              href={item.href}
              aria-current={actief ? "page" : undefined}
              className={`relative flex items-center px-3 text-[1.0625rem] font-bold transition-colors ${
                actief ? "text-actie-blauw" : "text-inkt hover:text-actie-blauw"
              }`}
            >
              {item.label}
              {actief && <span className="absolute inset-x-2 bottom-2 h-[3px] rounded-full bg-actie-blauw" aria-hidden />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ProfielMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [wisVragen, setWisVragen] = useState(false);
  const menuId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const knop = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const sluitBuiten = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const sluitEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        knop.current?.focus();
      }
    };
    document.addEventListener("pointerdown", sluitBuiten);
    document.addEventListener("keydown", sluitEscape);
    return () => {
      document.removeEventListener("pointerdown", sluitBuiten);
      document.removeEventListener("keydown", sluitEscape);
    };
  }, [open]);

  const { kind } = useProfiel();
  const sync = useSyncStatus();
  const syncTekst = {
    bewaard: "Je voortgang is bewaard.",
    bezig: "Bezig met bewaren…",
    wacht: "Nog niet opgeslagen. We proberen het opnieuw zodra er verbinding is.",
    mislukt: "Bewaren lukt nu niet. Vraag je ouder om opnieuw in te loggen.",
  }[sync];

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={knop}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-blauw-zacht"
      >
        {kind ? (
          <Avatar id={kind.avatar} />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-blauw-zacht" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/merk/mees-vogel.svg" alt="" className="h-6 w-auto" />
          </span>
        )}
        <span className="max-w-32 truncate font-bold">{kind?.voornaam ?? "Gast"}</span>
        <Icoon naam="chevron-omlaag" className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={menuId}
          className="mees-verschijn absolute right-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-[20px] border border-rand-zacht bg-wit p-5 shadow-zwevend"
        >
          {kind ? (
            <>
              <p className="font-bold">Hoi {kind.voornaam}!</p>
              <p className={`mt-1 tekst-klein ${sync === "mislukt" ? "text-fout" : "text-tekst-zacht"}`} role="status">
                {syncTekst}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <SecundaireKnop href="/kind/profiel" onClick={() => setOpen(false)} className="w-full">
                  Jouw profiel
                </SecundaireKnop>
                <SecundaireKnop href="/profielen" onClick={() => setOpen(false)} className="w-full">
                  Wissel profiel
                </SecundaireKnop>
              </div>
            </>
          ) : (
            <>
              <p className="font-bold">Je oefent als gast</p>
              <p className="mt-1 tekst-klein text-tekst-zacht">
                Je voortgang blijft alleen in deze browser op dit apparaat. Met een gratis ouderaccount kun je op elk apparaat verder.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <PrimaireKnop href="/voortgang-bewaren" onClick={() => setOpen(false)} className="w-full">
                  Bewaar je voortgang
                </PrimaireKnop>
                <SecundaireKnop href="/ouder/inloggen" onClick={() => setOpen(false)} className="w-full">
                  Inloggen als ouder
                </SecundaireKnop>
                <SecundaireKnop
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    setWisVragen(true);
                  }}
                >
                  Begin opnieuw
                </SecundaireKnop>
              </div>
            </>
          )}
        </div>
      )}

      <Dialoog open={wisVragen} onSluit={() => setWisVragen(false)} titel="Opnieuw beginnen?">
        <p>Je oefeningen, voortgang en weetjes in deze browser worden gewist. Dit kun je niet terugdraaien.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaireKnop
            onClick={() => {
              wisGastgegevens();
              setWisVragen(false);
              router.push("/kind/start");
            }}
          >
            Ja, wis alles
          </PrimaireKnop>
          <SecundaireKnop onClick={() => setWisVragen(false)}>Nee, terug</SecundaireKnop>
        </div>
      </Dialoog>
    </div>
  );
}

export function KindOnderNavigatie() {
  return (
    <Suspense fallback={null}>
      <OnderNavigatie />
    </Suspense>
  );
}

function OnderNavigatie() {
  const pad = usePathname();
  if (isOefenRoute(pad)) return null;
  return (
    <nav
      aria-label="Hoofdmenu"
      className="sticky bottom-0 z-30 border-t border-rand-zacht bg-wit pb-[env(safe-area-inset-bottom)] tablet:hidden"
    >
      <ul className="grid grid-cols-3">
        {kindNavigatie.map((item) => {
          const actief = item.actief(pad);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={actief ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[0.9375rem] font-bold ${
                  actief ? "text-actie-blauw" : "text-tekst-zacht"
                }`}
              >
                <Icoon naam={item.icoon} className="size-6" />
                {item.label}
                {actief && <span className="absolute bottom-1 h-[3px] w-12 rounded-full bg-actie-blauw" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
