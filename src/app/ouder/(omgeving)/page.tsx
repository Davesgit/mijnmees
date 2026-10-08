import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";
import { OnderdeelPictogram } from "@/components/mees/OnderdeelPictogram";
import { Avatar } from "@/components/mees/Profiel";
import { vindOnderdeel } from "@/content/onderwerpen";
import { leerdoelNaam, sessieNaam } from "@/features/oefenen/weergave";
import { sessieStatistiek } from "@/features/oefenen/sessie";
import { berekenBewijs, type BewijsStatus } from "@/features/voortgang/bewijs";
import { HulpKaart } from "@/features/tutorhulp/HulpKaart";
import { WerkbladenKaart } from "@/features/werkbladen/WerkbladenKaart";
import { haalKinderen, vereisOntgrendeldeOuder } from "@/lib/server/dal";
import { haalVoortgang, relatieveDag } from "@/lib/server/voortgang";

export const metadata: Metadata = { title: "Overzicht voor ouders" };

export default function OuderOverzichtPage({ searchParams }: PageProps<"/ouder">) {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:gap-8 tablet:py-10">
      <Suspense fallback={<Laden />}>
        <Overzicht searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const statusTekst: Record<BewijsStatus, { titel: string; uitleg: string; kleur: string; icoon: "check" | "hint" | "voortgang" }> = {
  "gaat-zelfstandig": { titel: "Gaat zelfstandig", uitleg: "Lukte zonder hulp, op meerdere oefenmomenten.", kleur: "bg-succes-zacht text-succes", icoon: "check" },
  "aan-het-oefenen": { titel: "Aan het oefenen", uitleg: "Wordt nu geoefend.", kleur: "bg-blauw-zacht text-actie-blauw", icoon: "voortgang" },
  "nog-eens-oefenen": { titel: "Nog eens oefenen", uitleg: "Goed om te herhalen.", kleur: "bg-probeer-opnieuw-zacht text-probeer-opnieuw", icoon: "hint" },
};

async function Overzicht({ searchParams }: { searchParams: PageProps<"/ouder">["searchParams"] }) {
  await vereisOntgrendeldeOuder("/ouder");
  const kinderen = await haalKinderen();
  const { kind: gekozenId } = await searchParams;

  if (kinderen.length === 0) {
    return (
      <>
        <h1 className="titel-held">Overzicht voor ouders</h1>
        <Kaart>
          <p className="text-lg">Voeg je eerste kinderprofiel toe. Daarna kan je kind meteen beginnen.</p>
          <PrimaireKnop href="/ouder/kind-toevoegen" className="mt-4">
            <Icoon naam="plus" />
            Kind toevoegen
          </PrimaireKnop>
        </Kaart>
      </>
    );
  }

  const kind = kinderen.find((k) => k.id === gekozenId) ?? kinderen[0];
  const voortgang = await haalVoortgang(kind.id);
  const sessies = voortgang ? Object.values(voortgang.sessies).sort((a, b) => b.gestartOp.localeCompare(a.gestartOp)) : [];
  const bewijs = voortgang ? berekenBewijs({ ...voortgang, schemaVersie: 1, gastId: "", instellingen: { groteTekst: false, rustigeOvergangen: false, rustigVerder: false } }) : [];

  return (
    <>
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <h1 className="titel-held">Hallo,</h1>
          <p className="mt-1 subtitel font-semibold text-tekst-zacht">Dit is het overzicht van {kind.voornaam}.</p>
        </div>
        {kinderen.length > 1 && (
          <nav aria-label="Kies een kind" className="flex flex-wrap gap-2">
            {kinderen.map((k) => (
              <Link
                key={k.id}
                href={`/ouder?kind=${k.id}`}
                aria-current={k.id === kind.id ? "true" : undefined}
                className={`inline-flex min-h-12 items-center gap-2 rounded-full border py-1 pl-1 pr-4 font-bold ${
                  k.id === kind.id ? "border-2 border-actie-blauw bg-blauw-zacht" : "border-rand-zacht bg-wit hover:bg-blauw-zacht"
                }`}
              >
                <Avatar id={k.avatar} />
                {k.voornaam}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <HulpKaart kindId={kind.id} voornaam={kind.voornaam} />

      <div className="grid gap-4 desktop:grid-cols-3">
        <Kaart titel="Onlangs geoefend" link={{ href: `/ouder/kind/${kind.id}/voortgang`, label: "Naar voortgang" }}>
          {sessies.length === 0 ? (
            <p className="text-tekst-zacht">Hier verschijnt het oefenen van {kind.voornaam}.</p>
          ) : (
            <ul className="divide-y divide-rand-zacht">
              {sessies.slice(0, 5).map((s) => {
                const o = vindOnderdeel(s.onderdeelId);
                const { zelfstandig, aantal } = sessieStatistiek(s);
                return (
                  <li key={s.id}>
                    <Link href={`/ouder/kind/${kind.id}/voortgang?sessie=${s.id}`} className="flex min-h-14 items-center gap-3 py-2 hover:text-actie-blauw">
                      <span className="grid h-11 w-16 shrink-0 place-items-center rounded-full bg-blauw-zacht text-actie-blauw" aria-hidden>
                        {o ? <OnderdeelPictogram soort={o.onderdeel.pictogram} /> : <Icoon naam={s.soort === "tafels" ? "tafels" : "landen"} className="size-6" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{sessieNaam(s)}</span>
                        <span className="block tekst-klein text-tekst-zacht">
                          {s.status === "afgerond" ? `${zelfstandig} van ${aantal} zonder hulp` : "Nog bezig"}
                        </span>
                      </span>
                      <span className="tekst-klein text-tekst-zacht">{relatieveDag(s.gestartOp)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Kaart>

        <Kaart titel="Zo gaat het">
          {bewijs.length === 0 ? (
            <p className="text-tekst-zacht">Nog geen resultaten. Mees kijkt naar meerdere oefenmomenten voordat er iets staat.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(["gaat-zelfstandig", "aan-het-oefenen", "nog-eens-oefenen"] as const).map((st) => {
                const items = bewijs.filter((b) => b.status === st);
                if (items.length === 0) return null;
                const t = statusTekst[st];
                return (
                  <li key={st} className={`flex items-start gap-3 rounded-[12px] p-4 ${t.kleur}`}>
                    <Icoon naam={t.icoon} className="mt-0.5 size-6" />
                    <span>
                      <span className="block font-bold">{t.titel}</span>
                      <span className="block tekst-klein text-inkt">
                        {items.map((b) => leerdoelNaam(b.leerdoelId)).join(", ")}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 tekst-klein text-tekst-zacht">Bekeken uitleg is geen bewijs van beheersing.</p>
        </Kaart>

        <Kaart titel="Weetjes en meer">
          <p>
            <span className="text-3xl font-extrabold">{voortgang?.weetjes.length ?? 0}</span>{" "}
            <span className="text-tekst-zacht">weetjes ontdekt</span>
          </p>
          <p className="mt-4 tekst-klein text-tekst-zacht">Tutorhulp zet je per kind aan of uit bij Instellingen.</p>
        </Kaart>
      </div>

      <WerkbladenKaart kindId={kind.id} voornaam={kind.voornaam} />

      <div className="flex flex-wrap gap-3">
        <PrimaireKnop href="/profielen">Laat {kind.voornaam} oefenen</PrimaireKnop>
        <Link href="/ouder/kind-toevoegen" className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-bold text-actie-blauw hover:bg-blauw-zacht">
          <Icoon naam="plus" />
          Kind toevoegen
        </Link>
      </div>
    </>
  );
}

function Kaart({ titel, link, children }: { titel?: string; link?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
      {titel && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="subtitel">{titel}</h2>
          {link && (
            <Link href={link.href} className="inline-flex min-h-12 items-center gap-1 rounded-[12px] px-2 font-bold text-actie-blauw hover:bg-blauw-zacht">
              {link.label}
              <Icoon naam="pijl-rechts" className="size-5" />
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
