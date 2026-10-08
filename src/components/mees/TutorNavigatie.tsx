"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { tutorUitloggen } from "@/app/tutor/acties";
import { Icoon } from "./Icoon";
import { Logo } from "./Mees";

const links = [
  { label: "Dashboard", href: "/tutor", actief: (p: string) => p === "/tutor" },
  { label: "Hulpvragen", href: "/tutor/hulpvragen", actief: (p: string) => p.startsWith("/tutor/hulpvragen") },
  { label: "Uitlegbibliotheek", href: "/tutor/uitlegbibliotheek", actief: (p: string) => p.startsWith("/tutor/uitleg") },
];

/** Tutornavigatie: duidelijk een werkomgeving, los van de kind- en ouderschermen. */
export function TutorNavigatie({ beheerder = false }: { beheerder?: boolean }) {
  const [open, setOpen] = useState(false);
  const alle = beheerder ? [...links, { label: "Beheer", href: "/beheer", actief: (p: string) => p.startsWith("/beheer") }] : links;
  return (
    <header className="sticky top-0 z-30 border-b border-rand-zacht bg-wit/95 backdrop-blur print:hidden">
      <a href="#inhoud" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-wit focus:px-4 focus:py-3 focus:text-actie-blauw">
        Naar de inhoud
      </a>
      <div className="mees-content flex h-16 items-center gap-4 tablet:h-[72px] desktop:h-20 desktop:gap-6">
        <Link href="/tutor" className="-ml-1 rounded-[12px] p-1" aria-label="Mees tutordashboard">
          <Logo />
        </Link>
        <span className="hidden rounded-full bg-vak-aardrijkskunde px-3 py-1 text-[0.9375rem] font-bold text-wit tablet:inline">Tutors</span>
        <nav aria-label="Tutormenu" className="hidden h-full desktop:block">
          <Suspense fallback={<Lijst pad="" links={alle} />}>
            <ActieveLijst links={alle} />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <form action={tutorUitloggen} className="hidden tablet:block">
            <button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-rand-interactief px-4 font-bold text-actie-blauw hover:bg-blauw-zacht">
              <Icoon naam="uitloggen" />
              Uitloggen
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="tutor-menu"
            className="grid size-12 place-items-center rounded-full hover:bg-blauw-zacht desktop:hidden"
            aria-label={open ? "Menu sluiten" : "Menu openen"}
          >
            <Icoon naam={open ? "sluiten" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <nav id="tutor-menu" aria-label="Tutormenu" className="border-t border-rand-zacht desktop:hidden">
          <ul className="mees-content flex flex-col py-2">
            {alle.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-[12px] px-2 text-lg font-bold">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="tablet:hidden">
              <form action={tutorUitloggen}>
                <button type="submit" className="flex min-h-12 w-full items-center rounded-[12px] px-2 text-lg font-bold text-actie-blauw">
                  Uitloggen
                </button>
              </form>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

type L = typeof links;

function ActieveLijst({ links }: { links: L }) {
  return <Lijst pad={usePathname()} links={links} />;
}

function Lijst({ pad, links }: { pad: string; links: L }) {
  return (
    <ul className="flex h-full items-stretch gap-2">
      {links.map((l) => {
        const actief = pad !== "" && l.actief(pad);
        return (
          <li key={l.href} className="flex">
            <Link href={l.href} aria-current={actief ? "page" : undefined} className={`relative flex items-center px-3 text-[1.0625rem] font-bold ${actief ? "text-actie-blauw" : "text-inkt hover:text-actie-blauw"}`}>
              {l.label}
              {actief && <span className="absolute inset-x-2 bottom-2 h-[3px] rounded-full bg-actie-blauw" aria-hidden />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
