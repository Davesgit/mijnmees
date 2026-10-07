import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { EuropaScherm } from "./EuropaScherm";

export const metadata: Metadata = { title: "Europa oefenen" };

export default function EuropaOefenPage({ params }: PageProps<"/kind/aardrijkskunde/europa/[sessieId]">) {
  return (
    <Suspense fallback={<Laden />}>
      <Sessie params={params} />
    </Suspense>
  );
}

async function Sessie({ params }: { params: PageProps<"/kind/aardrijkskunde/europa/[sessieId]">["params"] }) {
  const { sessieId } = await params;
  return <EuropaScherm sessieId={sessieId} />;
}
