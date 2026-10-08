import type { Metadata } from "next";
import { Suspense } from "react";
import { SmalKader } from "@/components/mees/SmalKader";
import { TutorInlogFormulier } from "./TutorInlogFormulier";

export const metadata: Metadata = { title: "Inloggen voor tutors" };

export default function TutorInloggenPage() {
  return (
    <SmalKader titel="Inloggen voor tutors" ondertitel="Welkom terug. Fijn dat je kinderen helpt." pose="helpt">
      <Suspense>
        <TutorInlogFormulier />
      </Suspense>
    </SmalKader>
  );
}
