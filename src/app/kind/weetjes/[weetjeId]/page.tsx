import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { vindWeetje, weetjes } from "@/content/weetjes";
import { WeetjeScherm } from "./WeetjeScherm";

export function generateStaticParams() {
  return weetjes.map((w) => ({ weetjeId: w.id }));
}

export async function generateMetadata({ params }: PageProps<"/kind/weetjes/[weetjeId]">): Promise<Metadata> {
  const { weetjeId } = await params;
  return { title: vindWeetje(weetjeId)?.titel ?? "Weetje" };
}

export default function WeetjePage({ params }: PageProps<"/kind/weetjes/[weetjeId]">) {
  return (
    <Suspense fallback={<Laden />}>
      <Weetje params={params} />
    </Suspense>
  );
}

async function Weetje({ params }: { params: PageProps<"/kind/weetjes/[weetjeId]">["params"] }) {
  const { weetjeId } = await params;
  const weetje = vindWeetje(weetjeId);
  if (!weetje) notFound();
  return <WeetjeScherm weetjeId={weetje.id} />;
}
