import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { NiveauAdvies } from "./NiveauAdvies";

export const metadata: Metadata = { title: "Een passend begin" };

export default function AdviesPage() {
  return (
    <Suspense fallback={<Laden />}>
      <NiveauAdvies />
    </Suspense>
  );
}
