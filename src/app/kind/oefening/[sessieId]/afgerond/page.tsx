import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { AfgerondScherm } from "./AfgerondScherm";

export const metadata: Metadata = { title: "Goed geoefend" };

export default function AfgerondPage({ params }: PageProps<"/kind/oefening/[sessieId]/afgerond">) {
  return (
    <Suspense fallback={<Laden />}>
      <Afgerond params={params} />
    </Suspense>
  );
}

async function Afgerond({ params }: { params: PageProps<"/kind/oefening/[sessieId]/afgerond">["params"] }) {
  const { sessieId } = await params;
  return <AfgerondScherm sessieId={sessieId} />;
}
