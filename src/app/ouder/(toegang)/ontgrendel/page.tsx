import type { Metadata } from "next";
import { Suspense } from "react";
import { SmalKader } from "@/components/mees/SmalKader";
import { OntgrendelFormulier } from "./OntgrendelFormulier";

export const metadata: Metadata = { title: "Voor ouders" };

export default function OntgrendelPage() {
  return (
    <SmalKader titel="Voor ouders" ondertitel="Vul je wachtwoord in om het ouderoverzicht te openen." pose="denkt-na">
      <Suspense>
        <OntgrendelFormulier />
      </Suspense>
    </SmalKader>
  );
}
