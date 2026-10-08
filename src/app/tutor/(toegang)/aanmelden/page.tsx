import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { SmalKader } from "@/components/mees/SmalKader";
import { haalOuder } from "@/lib/server/dal";
import { haalTutor } from "@/lib/server/rollen";
import { AanmeldFormulier } from "./AanmeldFormulier";

export const metadata: Metadata = { title: "Aanmelden als tutor" };

export default function AanmeldenPage({ searchParams }: PageProps<"/tutor/aanmelden">) {
  return (
    <SmalKader titel="Aanmelden als tutor" ondertitel="Help kinderen met een korte uitleg in je eigen tijd." pose="helpt">
      <Suspense fallback={<Laden />}>
        <Inhoud searchParams={searchParams} />
      </Suspense>
    </SmalKader>
  );
}

async function Inhoud({ searchParams }: Pick<PageProps<"/tutor/aanmelden">, "searchParams">) {
  const { verstuurd } = await searchParams;
  if (verstuurd) {
    return (
      <Melding soort="succes">
        <p className="font-bold">Bijna klaar. Bevestig je e-mailadres.</p>
        <p className="mt-1">We hebben je een mail gestuurd. Na het bevestigen bekijkt Mees je aanmelding. Geen mail? Kijk ook bij ongewenste berichten.</p>
      </Melding>
    );
  }
  const gebruiker = await haalOuder();
  if (gebruiker && (await haalTutor())) redirect("/tutor");
  return <AanmeldFormulier ingelogdAls={gebruiker?.email ?? null} />;
}
