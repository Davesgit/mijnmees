import Link from "next/link";
import { Icoon } from "@/components/mees/Icoon";
import { Logo } from "@/components/mees/Mees";

export default function WerkbladenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-rand-zacht print:hidden">
        <div className="mees-content flex h-16 items-center gap-4 tablet:h-[72px]">
          <Link href="/kind/start" className="-ml-1 rounded-[12px] p-1" aria-label="Mees, naar start">
            <Logo />
          </Link>
          <Link href="/kind/start" className="ml-auto inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 font-semibold text-actie-blauw hover:bg-blauw-zacht">
            <Icoon naam="pijl-links" className="size-5" />
            Terug naar Mees
          </Link>
        </div>
      </header>
      <main id="inhoud" className="flex flex-1 flex-col bg-achtergrond-zacht print:bg-wit">
        {children}
      </main>
    </>
  );
}
