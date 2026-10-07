import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { OefenScherm } from "../../oefenen/[sessieId]/OefenScherm";

export const metadata: Metadata = { title: "Tafeltrainer" };

export default function TafelOefenPage({ params }: PageProps<"/kind/tafeltrainer/[sessieId]">) {
  return (
    <Suspense fallback={<Laden />}>
      <Sessie params={params} />
    </Suspense>
  );
}

async function Sessie({ params }: { params: PageProps<"/kind/tafeltrainer/[sessieId]">["params"] }) {
  const { sessieId } = await params;
  return <OefenScherm sessieId={sessieId} />;
}
