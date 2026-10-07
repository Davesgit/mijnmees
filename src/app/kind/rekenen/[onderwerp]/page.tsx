import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden, OnderwerpTegel, TerugLink } from "@/components/mees/Bouwstenen";
import { Mees } from "@/components/mees/Mees";
import { OnderdeelPictogram } from "@/components/mees/OnderdeelPictogram";
import { rekenOnderwerpen, vindOnderwerp } from "@/content/onderwerpen";
import { heeftVragen } from "@/features/oefenen/vragen";

export function generateStaticParams() {
  return rekenOnderwerpen.filter((o) => o.beschikbaar && !o.eigenRoute).map((o) => ({ onderwerp: o.id }));
}

export async function generateMetadata({ params }: PageProps<"/kind/rekenen/[onderwerp]">): Promise<Metadata> {
  const { onderwerp } = await params;
  return { title: vindOnderwerp(onderwerp)?.naam ?? "Rekenen" };
}

export default function OnderwerpPage({ params }: PageProps<"/kind/rekenen/[onderwerp]">) {
  return (
    <Suspense fallback={<Laden />}>
      <Onderwerp params={params} />
    </Suspense>
  );
}

async function Onderwerp({ params }: { params: PageProps<"/kind/rekenen/[onderwerp]">["params"] }) {
  const { onderwerp: id } = await params;
  const onderwerp = vindOnderwerp(id);
  if (!onderwerp || !onderwerp.beschikbaar) notFound();

  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:gap-8 tablet:py-8 desktop:py-10">
      <div>
        <TerugLink href="/kind/rekenen">Rekenen</TerugLink>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="titel-held">{onderwerp.naam}</h1>
            <h2 className="mt-2 subtitel">Wat wil je oefenen?</h2>
            <p className="mt-1 tekst-intro text-tekst-zacht">Kies een onderdeel. Daarna stel je je oefening in.</p>
          </div>
          <Mees pose="helpt" breedte={240} className="w-28 shrink-0 tablet:w-44 desktop:mr-12 desktop:w-56" />
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 tablet:gap-4 desktop:grid-cols-3">
        {onderwerp.onderdelen.map((o) => (
          <li key={o.id}>
            <OnderwerpTegel
              href={`/kind/oefening/instellen?onderdeel=${o.id}`}
              naam={o.naam}
              beeld={<OnderdeelPictogram soort={o.pictogram} />}
              nietBeschikbaar={heeftVragen(o.leerdoelId) ? undefined : "Krijgt nog oefeningen"}
            />
          </li>
        ))}
      </ul>

      <p className="text-center tekst-klein text-tekst-zacht">
        Weet je niet wat je moet kiezen?{" "}
        <Link href="/kind/start" className="font-semibold text-actie-blauw underline underline-offset-4">
          Bekijk het voorstel van Mees.
        </Link>
      </p>
    </div>
  );
}
