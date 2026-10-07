import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { TafelInstellen } from "./TafelInstellen";

export const metadata: Metadata = { title: "Tafeltrainer" };

export default function TafeltrainerPage() {
  return (
    <Suspense fallback={<Laden />}>
      <TafelInstellen />
    </Suspense>
  );
}
