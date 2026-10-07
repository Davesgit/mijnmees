"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Melding, TerugLink } from "@/components/mees/Bouwstenen";
import type { FormStatus } from "@/components/mees/Formulier";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { AvatarKiezer } from "@/components/mees/KindVelden";
import { LeesoptiesKnop } from "@/components/mees/Leesopties";
import { Mees } from "@/components/mees/Mees";
import { useProfiel } from "@/components/mees/Profiel";
import { bewaarAvatar } from "@/app/ouder/kind-acties";

export function ProfielScherm() {
  const { kind } = useProfiel();
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(bewaarAvatar, {});

  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-3xl tablet:py-10">
      <TerugLink href="/kind/start">Terug</TerugLink>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="titel-held">Jouw profiel</h1>
          <p className="mt-2 tekst-intro text-tekst-zacht">{kind ? "Kies een dier dat bij je past." : "Je oefent nu als gast."}</p>
        </div>
        <Mees pose="zwaait" breedte={140} className="w-24 shrink-0 tablet:w-32" />
      </div>

      {kind ? (
        <form action={actie} className="flex flex-col gap-6">
          {status.melding && <Melding soort={status.gelukt ? "succes" : "fout"}>{status.melding}</Melding>}
          <AvatarKiezer standaard={kind.avatar} />
          <PrimaireKnop type="submit" disabled={bezig} className="self-start">
            {bezig ? "Even wachten…" : "Bewaar avatar"}
          </PrimaireKnop>
          <p className="tekst-klein text-tekst-zacht">Je naam of groep wijzigen? Dat doet je ouder.</p>
        </form>
      ) : (
        <Melding>
          Met een gratis ouderaccount krijg je een eigen profiel met je naam en een dier.{" "}
          <Link href="/voortgang-bewaren" className="font-bold text-actie-blauw underline underline-offset-4">
            Bewaar je voortgang
          </Link>
        </Melding>
      )}

      <section className="flex flex-col gap-3 border-t border-rand-zacht pt-6">
        <h2 className="subtitel">Lezen</h2>
        <p className="text-tekst-zacht">Grotere tekst, rustige overgangen of zelf verdergaan na een goed antwoord.</p>
        <LeesoptiesKnop className="self-start" />
      </section>

      {kind && (
        <SecundaireKnop href="/profielen" className="self-start">
          Wissel profiel
        </SecundaireKnop>
      )}
    </div>
  );
}
