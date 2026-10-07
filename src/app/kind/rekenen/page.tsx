import type { Metadata } from "next";
import Link from "next/link";
import { OnderwerpTegel, TerugLink } from "@/components/mees/Bouwstenen";
import { Mees } from "@/components/mees/Mees";
import { rekenOnderwerpen } from "@/content/onderwerpen";

export const metadata: Metadata = { title: "Rekenen" };

export default function RekenenPage() {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:gap-8 tablet:py-8 desktop:py-10">
      <div>
        <TerugLink href="/kind/start">Start</TerugLink>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="titel-held">Rekenen</h1>
            <h2 className="mt-2 subtitel">Wat wil je oefenen?</h2>
            <p className="mt-1 tekst-intro text-tekst-zacht">Kies een onderwerp. Daarna kies je wat je wilt oefenen.</p>
          </div>
          <Mees pose="op-boeken" breedte={180} className="w-20 shrink-0 tablet:w-32 desktop:mr-12 desktop:w-40" />
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 tablet:gap-4 desktop:grid-cols-3">
        {rekenOnderwerpen.map((o) => (
          <li key={o.id}>
            <OnderwerpTegel
              href={o.eigenRoute ?? `/kind/rekenen/${o.id}`}
              naam={o.naam}
              icoon={o.icoon}
              nietBeschikbaar={o.beschikbaar ? undefined : "Komt binnenkort"}
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-2 text-center tekst-klein text-tekst-zacht">
        <p className="flex items-center gap-3">
          <Mees pose="blij" breedte={40} className="w-10" />
          Mees helpt je binnen elk onderwerp een passende oefening te kiezen.
        </p>
        <p>
          Je kunt ook{" "}
          <Link href="/kind/aardrijkskunde/europa" className="font-semibold text-actie-blauw underline underline-offset-4">
            aardrijkskunde oefenen: Europa
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
