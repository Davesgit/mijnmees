import Link from "next/link";
import { Logo } from "@/components/mees/Mees";
import { tutorUitloggen } from "@/app/tutor/acties";

export default function BeheerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-rand-zacht bg-wit/95 backdrop-blur">
        <div className="mees-content flex h-16 items-center gap-4 tablet:h-[72px]">
          <Link href="/beheer" className="-ml-1 rounded-[12px] p-1" aria-label="Mees beheer">
            <Logo />
          </Link>
          <span className="rounded-full bg-inkt px-3 py-1 text-[0.9375rem] font-bold text-wit">Beheer</span>
          <form action={tutorUitloggen} className="ml-auto">
            <button type="submit" className="inline-flex min-h-12 items-center rounded-full border border-rand-interactief px-4 font-bold text-actie-blauw hover:bg-blauw-zacht">
              Uitloggen
            </button>
          </form>
        </div>
      </header>
      <main id="inhoud" className="flex flex-1 flex-col bg-achtergrond-zacht">
        {children}
      </main>
    </>
  );
}
