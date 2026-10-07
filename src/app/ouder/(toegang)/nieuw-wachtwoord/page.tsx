import type { Metadata } from "next";
import { Suspense } from "react";
import { SmalKader } from "@/components/mees/SmalKader";
import { NieuwWachtwoordFormulier } from "./NieuwWachtwoordFormulier";

export const metadata: Metadata = { title: "Nieuw wachtwoord" };

export default function NieuwWachtwoordPage() {
  return (
    <SmalKader titel="Kies een nieuw wachtwoord" ondertitel="De link uit je herstelmail is tijdelijk geldig." pose="helpt">
      <Suspense>
        <NieuwWachtwoordFormulier />
      </Suspense>
    </SmalKader>
  );
}
