import type { Metadata } from "next";
import { Suspense } from "react";
import { SmalKader } from "@/components/mees/SmalKader";
import { VerifieerInhoud } from "./VerifieerInhoud";

export const metadata: Metadata = { title: "Controleer je e-mail" };

export default function VerifieerPage() {
  return (
    <SmalKader titel="Controleer je e-mail" ondertitel="Open de link in de mail om je account te bevestigen." pose="zwaait">
      <Suspense>
        <VerifieerInhoud />
      </Suspense>
    </SmalKader>
  );
}
