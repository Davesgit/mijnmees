import type { Metadata } from "next";
import Link from "next/link";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { GastStand } from "./GastStand";

export const metadata: Metadata = { title: "Bewaar je voortgang" };

export default function VoortgangBewarenPage() {
  return (
    <div className="mees-content flex flex-col items-center gap-6 py-10 text-center tablet:max-w-2xl tablet:py-14">
      <Mees pose="zwaait" breedte={180} prioriteit className="w-36 tablet:w-44" />
      <div>
        <h1 className="titel-held">Bewaar je voortgang</h1>
        <p className="mt-2 subtitel font-semibold text-tekst-zacht">Vraag je ouder om een gratis account.</p>
      </div>
      <div className="flex w-full items-start gap-4 rounded-[16px] bg-blauw-zacht p-5 text-left">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-wit text-actie-blauw" aria-hidden>
          <Icoon naam="scherm" className="size-7" />
        </span>
        <span>
          <span className="block font-bold">Nu oefen je op dit apparaat.</span>
          <span className="block text-tekst-zacht">
            Je voortgang staat alleen in deze browser. Op een ander apparaat zie je hem niet, en als de browsergegevens worden gewist, is hij weg.
            Met een account kan Mees je helpen op jouw niveau.
          </span>
        </span>
      </div>
      <div className="flex w-full flex-col gap-3">
        <PrimaireKnop href="/ouder/account-aanmaken" groot className="w-full">
          Samen met mijn ouder bewaren
          <Icoon naam="pijl-rechts" />
        </PrimaireKnop>
        <SecundaireKnop href="/ouder/inloggen" groot className="w-full">
          Mijn ouder heeft al een account
        </SecundaireKnop>
        <GastStand />
      </div>
      <Link href="/kind/start" className="inline-flex min-h-12 items-center rounded-[12px] px-3 font-bold text-actie-blauw hover:bg-blauw-zacht">
        Klaar voor nu
      </Link>
    </div>
  );
}
