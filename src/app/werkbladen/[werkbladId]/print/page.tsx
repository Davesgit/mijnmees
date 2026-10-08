import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { PrintWeergave } from "./PrintWeergave";

export const metadata: Metadata = { title: "Werkblad printen" };

export default function PrintPage({ params }: PageProps<"/werkbladen/[werkbladId]/print">) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud params={params} />
    </Suspense>
  );
}

async function Inhoud({ params }: Pick<PageProps<"/werkbladen/[werkbladId]/print">, "params">) {
  const { werkbladId } = await params;
  return <PrintWeergave id={werkbladId} />;
}
