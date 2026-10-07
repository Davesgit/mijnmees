"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { Icoon } from "./Icoon";
import { Logo } from "./Mees";

const links = [
  { label: "Voor ouders", href: "/" },
  { label: "Hoe het werkt", href: "/hoe-mees-werkt" },
  { label: "Onze donateurs", href: "/donateurs" },
];

/** Publieke navigatie voor ouders (A00, A01–A04, A06, A07, I01). */
export function PubliekHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-rand-zacht bg-wit/95 backdrop-blur">
      <a
        href="#inhoud"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-wit focus:px-4 focus:py-3 focus:text-actie-blauw"
      >
        Naar de inhoud
      </a>
      <div className="mees-content flex h-16 items-center gap-6 tablet:h-[72px] desktop:h-20">
        <Link href="/" className="-ml-1 rounded-[12px] p-1" aria-label="Mees, naar de startpagina">
          <Logo />
        </Link>
        <nav aria-label="Hoofdmenu" className="hidden h-full desktop:block">
          <Suspense fallback={<Lijst pad="" />}>
            <ActieveLijst />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/ouder/inloggen"
            className="inline-flex min-h-12 items-center rounded-full border border-rand-interactief px-5 font-bold text-actie-blauw hover:bg-blauw-zacht"
          >
            Inloggen
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="publiek-menu"
            className="grid size-12 place-items-center rounded-full hover:bg-blauw-zacht desktop:hidden"
            aria-label={open ? "Menu sluiten" : "Menu openen"}
          >
            <Icoon naam={open ? "sluiten" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <nav id="publiek-menu" aria-label="Hoofdmenu" className="border-t border-rand-zacht desktop:hidden">
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
        const actief = pad === l.href;
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

export function PubliekeVoet() {
  return (
    <footer className="mt-auto border-t border-rand-zacht bg-achtergrond-zacht">
      <div className="mees-content flex flex-col gap-3 py-8 tekst-klein text-tekst-zacht tablet:flex-row tablet:items-center tablet:justify-between">
        <p>Mees is gratis, voor altijd. Geen advertenties, geen tracking.</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <Link href="/privacy" className="underline underline-offset-4 hover:text-actie-blauw">
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/hoe-mees-werkt" className="underline underline-offset-4 hover:text-actie-blauw">
              Hoe Mees werkt
            </Link>
          </li>
          <li>
            <Link href="/donateurs" className="underline underline-offset-4 hover:text-actie-blauw">
              Donateurs
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
