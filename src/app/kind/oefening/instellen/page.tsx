import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden, Melding, TerugLink } from "@/components/mees/Bouwstenen";
import { vindOnderdeel } from "@/content/onderwerpen";
import { heeftVragen } from "@/features/oefenen/vragen";
import { InstelScherm } from "./InstelScherm";

export const metadata: Metadata = { title: "Oefening instellen" };

export default function InstellenPage({ searchParams }: PageProps<"/kind/oefening/instellen">) {
  return (
    <Suspense fallback={<Laden />}>
      <Instellen searchParams={searchParams} />
    </Suspense>
  );
}

async function Instellen({ searchParams }: { searchParams: PageProps<"/kind/oefening/instellen">["searchParams"] }) {
  const { onderdeel: onderdeelId, niveau } = await searchParams;
  const gevonden = typeof onderdeelId === "string" ? vindOnderdeel(onderdeelId) : null;

  if (!gevonden || !heeftVragen(gevonden.onderdeel.leerdoelId)) {
    return (
      <div className="mees-content py-8">
        <TerugLink href="/kind/rekenen">Rekenen</TerugLink>
        <h1 className="mt-4 titel-pagina">Oefening instellen</h1>
        <Melding className="mt-6">
          {gevonden ? "Dit onderdeel krijgt nog oefeningen. Kies een ander onderdeel." : "Kies eerst wat je wilt oefenen."}
        </Melding>
      </div>
    );
  }

  return (
    <InstelScherm
      onderwerpId={gevonden.onderwerp.id}
      onderwerpNaam={gevonden.onderwerp.naam}
      onderdeelId={gevonden.onderdeel.id}
      onderdeelNaam={gevonden.onderdeel.naam}
      leerdoelId={gevonden.onderdeel.leerdoelId!}
      voorkeurNiveau={niveau === "makkelijk" || niveau === "past-bij-mij" || niveau === "uitdagend" ? niveau : undefined}
    />
  );
}
