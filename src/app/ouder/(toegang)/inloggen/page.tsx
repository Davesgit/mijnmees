import type { Metadata } from "next";
import { Suspense } from "react";
import { SmalKader } from "@/components/mees/SmalKader";
import { InlogFormulier } from "./InlogFormulier";

export const metadata: Metadata = { title: "Inloggen" };

export default function InloggenPage() {
  return (
    <SmalKader titel="Welkom terug" ondertitel="Log in als ouder. Je kind kiest daarna het eigen profiel.">
      <Suspense>
        <InlogFormulier />
      </Suspense>
    </SmalKader>
  );
}
