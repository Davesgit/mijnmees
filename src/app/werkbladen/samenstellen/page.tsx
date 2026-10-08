import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { Samenstellen } from "./Samenstellen";

export const metadata: Metadata = { title: "Maak een werkblad" };

export default function SamenstellenPage() {
  return (
    <Suspense fallback={<Laden />}>
      <Samenstellen />
    </Suspense>
  );
}
