import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { Logo } from "@/components/mees/Mees";
import { haalKinderen, vereisOuder } from "@/lib/server/dal";
import { ProfielKnop } from "./ProfielKnop";
import { kiesKind } from "../ouder/kind-acties";
import { UitlogKnop } from "../ouder/UitlogKnop";

export const metadata: Metadata = { title: "Wie gaat oefenen?" };

export default function ProfielenPage() {
  return (
    <>
      <header className="border-b border-rand-zacht">
        <div className="mees-content flex h-16 items-center tablet:h-[72px] desktop:h-20">
          <Link href="/profielen" className="-ml-1 rounded-[12px] p-1" aria-label="Mees">
            <Logo />
          </Link>
          <Link
            href="/ouder"
            className="ml-auto inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 font-semibold text-inkt hover:bg-blauw-zacht desktop:border-l desktop:border-rand-zacht desktop:pl-6"
          >
            <Icoon naam="slot" className="size-6" />
            Voor ouders
          </Link>
        </div>
      </header>
      <main id="inhoud" className="mees-content flex flex-1 flex-col items-center py-10 text-center tablet:py-16">
        <h1 className="titel-held">Wie gaat oefenen?</h1>
        <p className="mt-2 tekst-intro text-tekst-zacht">Kies je profiel.</p>
        <Suspense fallback={<Laden />}>
          <Profielen />
        </Suspense>
      </main>
    </>
  );
}

async function Profielen() {
  await vereisOuder("/profielen");
  const kinderen = await haalKinderen();

  return (
    <>
      {kinderen.length === 0 && <p className="mt-8 text-lg">Voeg eerst een kinderprofiel toe.</p>}
      <ul className="mt-8 grid w-full max-w-4xl grid-cols-2 gap-3 tablet:mt-12 tablet:gap-4 desktop:grid-cols-3">
        {kinderen.map((k) => (
          <li key={k.id}>
            <form action={kiesKind}>
              <input type="hidden" name="kindId" value={k.id} />
              <ProfielKnop voornaam={k.voornaam} avatar={k.avatar} />
            </form>
          </li>
        ))}
        <li>
          <Link
            href="/ouder/kind-toevoegen"
            className="flex h-full flex-col items-center justify-center gap-3 rounded-[16px] border border-rand-zacht bg-wit p-4 transition-colors hover:border-actie-blauw hover:bg-blauw-zacht tablet:gap-4 tablet:p-8"
          >
            <span className="grid size-24 place-items-center rounded-full bg-blauw-zacht text-actie-blauw tablet:size-36" aria-hidden>
              <Icoon naam="plus" className="size-12" />
            </span>
            <span className="subtitel">Kind toevoegen</span>
            <span className="grid size-12 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
              <Icoon naam="pijl-rechts" />
            </span>
          </Link>
        </li>
      </ul>
      <div className="mt-10">
        <UitlogKnop />
      </div>
    </>
  );
}
