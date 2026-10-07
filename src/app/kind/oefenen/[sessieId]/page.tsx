import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { OefenScherm } from "./OefenScherm";

export const metadata: Metadata = { title: "Oefenen" };

export default function OefenPage({ params }: PageProps<"/kind/oefenen/[sessieId]">) {
  return (
    <Suspense fallback={<Laden />}>
      <Sessie params={params} />
    </Suspense>
  );
}

async function Sessie({ params }: { params: PageProps<"/kind/oefenen/[sessieId]">["params"] }) {
  const { sessieId } = await params;
  return <OefenScherm sessieId={sessieId} />;
}
