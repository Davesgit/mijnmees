"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { Icoon } from "./Icoon";
import { Logo } from "./Mees";

const links = [
  { label: "Overzicht", href: "/ouder", actief: (p: string) => p === "/ouder" || p.startsWith("/ouder/kind/") },
  { label: "Instellingen", href: "/ouder/instellingen", actief: (p: string) => p.startsWith("/ouder/instellingen") || p === "/ouder/kind-toevoegen" },
  { label: "Privacy", href: "/ouder/privacy", actief: (p: string) => p.startsWith("/ouder/privacy") },
];

/** OuderNavigatie: herkenbaar anders dan de kindnavigatie, met een duidelijke weg terug naar de kinderen. */
export function OuderNavigatie() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-rand-zacht bg-wit/95 backdrop-blur">
      <a
        href="#inhoud"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-wit focus:px-4 focus:py-3 focus:text-actie-blauw"
      >
        Naar de inhoud
      </a>
      <div className="mees-content flex h-16 items-center gap-4 tablet:h-[72px] desktop:h-20 desktop:gap-6">
        <Link href="/ouder" className="-ml-1 rounded-[12px] p-1" aria-label="Mees ouderoverzicht">
          <Logo />
        </Link>
        <span className="hidden rounded-full bg-inkt px-3 py-1 text-[0.9375rem] font-bold text-wit tablet:inline">Ouders</span>
        <nav aria-label="Oudermenu" className="hidden h-full desktop:block">
          <Suspense fallback={<Lijst pad="" />}>
            <ActieveLijst />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/profielen"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-rand-interactief px-4 font-bold text-actie-blauw hover:bg-blauw-zacht"
          >
            <span className="hidden min-[420px]:inline">Naar de kinderen</span>
            <span className="min-[420px]:hidden">Kinderen</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="ouder-menu"
            className="grid size-12 place-items-center rounded-full hover:bg-blauw-zacht desktop:hidden"
            aria-label={open ? "Menu sluiten" : "Menu openen"}
          >
            <Icoon naam={open ? "sluiten" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <nav id="ouder-menu" aria-label="Oudermenu" className="border-t border-rand-zacht desktop:hidden">
          <ul className="mees-content flex flex-col py-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-[12px] px-2 text-lg font-bold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function ActieveLijst() {
  return <Lijst pad={usePathname()} />;
}

function Lijst({ pad }: { pad: string }) {
  return (
    <ul className="flex h-full items-stretch gap-2">
      {links.map((l) => {
        const actief = pad !== "" && l.actief(pad);
        return (
          <li key={l.href} className="flex">
            <Link
              href={l.href}
              aria-current={actief ? "page" : undefined}
              className={`relative flex items-center px-3 text-[1.0625rem] font-bold ${actief ? "text-actie-blauw" : "text-inkt hover:text-actie-blauw"}`}
            >
              {l.label}
              {actief && <span className="absolute inset-x-2 bottom-2 h-[3px] rounded-full bg-actie-blauw" aria-hidden />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
