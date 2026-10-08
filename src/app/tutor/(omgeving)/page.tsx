import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Laden, Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { Mees } from "@/components/mees/Mees";
import { leerdoelNaam } from "@/features/oefenen/weergave";
import { formatLesDatum, formatLesTijd } from "@/features/live/regels";
import { haalLesvoorstellen, haalTutorLessen } from "@/features/live/server";
import { haalBibliotheek, haalWerkvoorraad } from "@/features/tutorhulp/server";
import { haalOuder } from "@/lib/server/dal";
import { haalTutor, type Tutor } from "@/lib/server/rollen";

export const metadata: Metadata = { title: "Tutordashboard" };

/** U01, of de status van de aanmelding zolang die nog niet is goedgekeurd. */
export default function TutorDashboardPage() {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:py-10">
      <Suspense fallback={<Laden />}>
        <Inhoud />
      </Suspense>
    </div>
  );
}

async function Inhoud() {
  if (!(await haalOuder())) redirect("/tutor/inloggen");
  const tutor = await haalTutor();
  if (!tutor) redirect("/tutor/aanmelden");
  if (tutor.status !== "goedgekeurd") return <Wachten tutor={tutor} />;

  const [werk, bibliotheek, voorstellen, lessen] = await Promise.all([haalWerkvoorraad(tutor), haalBibliotheek(tutor), haalLesvoorstellen(tutor), haalTutorLessen(tutor)]);
  const komend = lessen.filter((l) => l.status === "gepland" || l.status === "live").reverse().slice(0, 5);
  const nieuw = werk.filter((w) => !w.vanMij && w.status === "nieuw").length;
  const mijn = werk.filter((w) => w.vanMij && w.status !== "afgerond");
  const wachtOpControle = mijn.filter((w) => w.status === "uitleg-verstuurd").length;
  const concepten = bibliotheek.filter((b) => b.vanMij && b.status === "concept").length;

  const tegels = [
    { titel: "Nieuwe hulpvragen", getal: nieuw, href: "/tutor/hulpvragen", uitleg: "Klaar om op te pakken." },
    { titel: "Mijn hulpvragen", getal: mijn.length - wachtOpControle, href: "/tutor/hulpvragen", uitleg: "Je bent ermee bezig." },
    { titel: "Wacht op controlevraag", getal: wachtOpControle, href: "/tutor/hulpvragen", uitleg: "Uitleg is verstuurd." },
    { titel: "Uitleg controleren", getal: concepten, href: "/tutor/uitlegbibliotheek", uitleg: "Concepten van jou." },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="titel-held">Hallo {tutor.voornaam}</h1>
          <p className="mt-1 subtitel font-semibold text-tekst-zacht">Hulpvragen, uitleg en straks lessen.</p>
        </div>
        <Mees pose="helpt" breedte={160} className="hidden w-32 tablet:block" />
      </div>
      <ul className="grid gap-3 min-[480px]:grid-cols-2 desktop:grid-cols-4">
        {tegels.map((t) => (
          <li key={t.titel}>
            <Link href={t.href} className="flex h-full flex-col gap-1 rounded-[16px] border border-rand-zacht bg-wit p-5 hover:border-actie-blauw">
              <span className="text-4xl font-extrabold tabular-nums text-actie-blauw">{t.getal}</span>
              <span className="font-bold">{t.titel}</span>
              <span className="tekst-klein text-tekst-zacht">{t.uitleg}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 min-[480px]:flex-row">
        <PrimaireKnop href="/tutor/hulpvragen">
          Open werkvoorraad
          <Icoon naam="pijl-rechts" />
        </PrimaireKnop>
        <SecundaireKnop href="/tutor/uitlegbibliotheek">Uitlegbibliotheek</SecundaireKnop>
      </div>
      <div className="grid gap-4 desktop:grid-cols-2">
        <section className="rounded-[16px] border border-rand-zacht bg-wit p-5">
          <h2 className="subtitel">Lesvoorstellen</h2>
          {voorstellen.length === 0 ? (
            <p className="mt-2 text-tekst-zacht">Er zijn nu geen lesvoorstellen. Een voorstel verschijnt als meerdere kinderen op hetzelfde onderdeel vastlopen.</p>
          ) : (
            <ul className="mt-2 divide-y divide-rand-zacht">
              {voorstellen.map((v) => (
                <li key={v.leerdoelId}>
                  <Link href={`/tutor/lesvoorstellen/${encodeURIComponent(v.leerdoelId)}`} className="flex min-h-14 items-center justify-between gap-3 py-2 hover:text-actie-blauw">
                    <span>
                      <span className="block font-bold">{leerdoelNaam(v.leerdoelId)}</span>
                      <span className="block tekst-klein text-tekst-zacht">{v.aantal} verschillende kinderen</span>
                    </span>
                    <Icoon naam="chevron-rechts" className="size-5 text-actie-blauw" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-[16px] border border-rand-zacht bg-wit p-5">
          <h2 className="subtitel">Mijn lessen</h2>
          {komend.length === 0 ? (
            <p className="mt-2 text-tekst-zacht">Je hebt geen geplande lessen.</p>
          ) : (
            <ul className="mt-2 divide-y divide-rand-zacht">
              {komend.map((l) => (
                <li key={l.id}>
                  <Link href={`/tutor/lessen/${l.id}/live`} className="flex min-h-14 items-center justify-between gap-3 py-2 hover:text-actie-blauw">
                    <span>
                      <span className="block font-bold">{l.titel}</span>
                      <span className="block tekst-klein text-tekst-zacht">
                        {l.status === "live" ? "Nu live" : `${formatLesDatum(l.startOp)} om ${formatLesTijd(l.startOp)}`} · {l.aangemeld}/{l.capaciteit} aangemeld
                      </span>
                    </span>
                    <Icoon naam="chevron-rechts" className="size-5 text-actie-blauw" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Wachten({ tutor }: { tutor: Tutor }) {
  const tekst = {
    aangemeld: { titel: "We bekijken je aanmelding", uitleg: "Bedankt voor je aanmelding! Mees bekijkt je gegevens. Je hoort het via deze pagina; je hoeft niets te doen." },
    afgewezen: { titel: "Je aanmelding is niet goedgekeurd", uitleg: "Op dit moment kunnen we je aanmelding niet goedkeuren. Bedankt voor je interesse in Mees." },
    geschorst: { titel: "Je toegang staat op pauze", uitleg: "Je kunt nu geen hulpvragen oppakken. Heb je vragen? Neem contact op met Mees." },
    goedgekeurd: { titel: "", uitleg: "" },
  }[tutor.status];
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="titel-held">{tekst.titel}</h1>
      <Melding>{tekst.uitleg}</Melding>
      <p className="text-tekst-zacht">
        Aangemeld als {tutor.voornaam} {tutor.achternaam} ({tutor.email}).
      </p>
    </div>
  );
}
