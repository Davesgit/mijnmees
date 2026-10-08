import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { WerkbladWeergave } from "./WerkbladWeergave";

export const metadata: Metadata = { title: "Je werkblad" };

export default function WerkbladPage({ params }: PageProps<"/werkbladen/[werkbladId]">) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud params={params} />
    </Suspense>
  );
}

async function Inhoud({ params }: Pick<PageProps<"/werkbladen/[werkbladId]">, "params">) {
  const { werkbladId } = await params;
  return <WerkbladWeergave id={werkbladId} />;
}
