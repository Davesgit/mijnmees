import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { LesKaart } from "@/features/live/LesKaart";
import type { OpslagData } from "@/features/oefenen/types";
import { OuderChat } from "@/features/ouderchat/OuderChat";
import type { OuderKind } from "@/features/ouderchat/ouder-gesprek";
import { HulpKaart } from "@/features/tutorhulp/HulpKaart";
import { berekenBewijs } from "@/features/voortgang/bewijs";
import { haalKinderen, vereisOntgrendeldeOuder } from "@/lib/server/dal";
import { haalVoortgang } from "@/lib/server/voortgang";

export const metadata: Metadata = { title: "Voor ouders" };

/** De ouderomgeving als chat: Mees vat de voortgang per kind samen en geeft suggesties voor thuis. */
export default function OuderPage() {
  return (
    <Suspense fallback={<Laden />}>
      <Ouderchat />
    </Suspense>
  );
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function Ouderchat() {
  await vereisOntgrendeldeOuder("/ouder");
  const kinderen = await haalKinderen();
  const nu = new Date();
  const metVoortgang: OuderKind[] = await Promise.all(
    kinderen.map(async (k) => {
      const v = await haalVoortgang(k.id);
      if (!v) return { id: k.id, voornaam: k.voornaam, bewijs: [], week: { momenten: 0, vragen: 0, zelfGoed: 0 } };
      const data: OpslagData = { ...v, schemaVersie: 1, gastId: "", instellingen: { groteTekst: false, rustigeOvergangen: false, rustigVerder: false } };
      // Oefenen in de afgelopen week: oefenmomenten, eerste pogingen en hoeveel daarvan zonder hulp goed waren.
      const week = v.pogingen.filter((p) => nu.getTime() - new Date(p.op).getTime() < WEEK_MS && p.eerstePoging);
      return {
        id: k.id,
        voornaam: k.voornaam,
        bewijs: berekenBewijs(data, nu),
        week: {
          momenten: new Set(week.map((p) => p.sessieId)).size,
          vragen: week.length,
          zelfGoed: week.filter((p) => p.resultaat === "goed" && p.hulpVooraf.hints === 0 && !p.hulpVooraf.uitleg).length,
        },
      };
    }),
  );
  return (
    <OuderChat
      kinderen={metVoortgang}
      meldingen={
        // Uitnodigingen voor live lessen en tutorhulp blijven zichtbaar op het startscherm.
        <Suspense fallback={null}>
          {kinderen.map((k) => (
            <div key={k.id} className="flex flex-col gap-3 empty:hidden">
              <LesKaart kindId={k.id} voornaam={k.voornaam} />
              <HulpKaart kindId={k.id} voornaam={k.voornaam} />
            </div>
          ))}
        </Suspense>
      }
    />
  );
}
