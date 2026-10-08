import type { Metadata } from "next";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { GevaarKnop, PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { formatDatum } from "@/lib/server/voortgang";
import { vereisBeheerder, type TutorStatus } from "@/lib/server/rollen";
import { createAdminClient } from "@/lib/supabase/admin";
import { beoordeelTutor } from "./acties";

export const metadata: Metadata = { title: "Beheer", robots: { index: false } };

export default function BeheerPage() {
  return (
    <div className="mees-content flex flex-col gap-8 py-6 tablet:py-10">
      <h1 className="titel-held">Beheer</h1>
      <Suspense fallback={<Laden />}>
        <Inhoud />
      </Suspense>
    </div>
  );
}

type TutorRij = { id: string; voornaam: string; achternaam: string; ervaring: string; motivatie: string; status: TutorStatus; aangemeld_op: string; beoordeeld_op: string | null };

async function Inhoud() {
  await vereisBeheerder();
  const db = createAdminClient();
  const [tutors, ouders, kinderen, open, uitleg, donateurs] = await Promise.all([
    db.from("tutors").select("id, voornaam, achternaam, ervaring, motivatie, status, aangemeld_op, beoordeeld_op").order("aangemeld_op", { ascending: false }),
    db.from("ouders").select("*", { count: "exact", head: true }),
    db.from("kinderen").select("*", { count: "exact", head: true }),
    db.from("hulpvragen").select("*", { count: "exact", head: true }).neq("status", "afgerond"),
    db.from("uitleg").select("*", { count: "exact", head: true }).eq("status", "gepubliceerd"),
    db.from("donateur_aanmeldingen").select("id, naam, email, organisatie, looptijd, toelichting, status, aangemaakt_op").order("aangemaakt_op", { ascending: false }).limit(50),
  ]);
  const rijen = (tutors.data ?? []) as TutorRij[];
  // E-mailadressen alleen voor de beheerder, om contact op te nemen over een aanmelding.
  const emails = new Map(
    await Promise.all(rijen.map(async (t) => [t.id, (await db.auth.admin.getUserById(t.id)).data.user?.email ?? "onbekend"] as const)),
  );
  const aanmeldingen = rijen.filter((t) => t.status === "aangemeld");
  const overig = rijen.filter((t) => t.status !== "aangemeld");

  const cijfers = [
    { titel: "Ouderaccounts", getal: ouders.count ?? 0 },
    { titel: "Kinderprofielen", getal: kinderen.count ?? 0 },
    { titel: "Open hulpvragen", getal: open.count ?? 0 },
    { titel: "Gepubliceerde uitleg", getal: uitleg.count ?? 0 },
  ];

  return (
    <>
      <ul className="grid gap-3 min-[480px]:grid-cols-2 desktop:grid-cols-4">
        {cijfers.map((c) => (
          <li key={c.titel} className="rounded-[16px] border border-rand-zacht bg-wit p-5">
            <span className="block text-4xl font-extrabold tabular-nums text-actie-blauw">{c.getal}</span>
            <span className="font-bold">{c.titel}</span>
          </li>
        ))}
      </ul>

      <section aria-labelledby="aanmeldingen">
        <h2 id="aanmeldingen" className="subtitel">
          Nieuwe tutoraanmeldingen <span className="text-tekst-zacht">({aanmeldingen.length})</span>
        </h2>
        {aanmeldingen.length === 0 && <p className="mt-2 text-tekst-zacht">Er zijn geen nieuwe aanmeldingen.</p>}
        <ul className="mt-3 flex flex-col gap-4">
          {aanmeldingen.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-5">
              <div>
                <p className="text-lg font-bold">
                  {t.voornaam} {t.achternaam}
                </p>
                <p className="tekst-klein text-tekst-zacht">
                  {emails.get(t.id)} · aangemeld {formatDatum(t.aangemeld_op)}
                </p>
              </div>
              <div className="grid gap-3 tablet:grid-cols-2">
                <div>
                  <p className="tekst-klein font-bold">Ervaring</p>
                  <p className="whitespace-pre-line">{t.ervaring}</p>
                </div>
                <div>
                  <p className="tekst-klein font-bold">Motivatie</p>
                  <p className="whitespace-pre-line">{t.motivatie}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={beoordeelTutor}>
                  <input type="hidden" name="tutorId" value={t.id} />
                  <input type="hidden" name="status" value="goedgekeurd" />
                  <PrimaireKnop type="submit">Goedkeuren</PrimaireKnop>
                </form>
                <form action={beoordeelTutor}>
                  <input type="hidden" name="tutorId" value={t.id} />
                  <input type="hidden" name="status" value="afgewezen" />
                  <SecundaireKnop type="submit">Afwijzen</SecundaireKnop>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="donateurs-kop">
        <h2 id="donateurs-kop" className="subtitel">
          Aanmeldingen meerjarige steun <span className="text-tekst-zacht">({donateurs.data?.length ?? 0})</span>
        </h2>
        {(donateurs.data ?? []).length === 0 ? (
          <p className="mt-2 text-tekst-zacht">Nog geen aanmeldingen.</p>
        ) : (
          <ul className="mt-3 divide-y divide-rand-zacht rounded-[16px] border border-rand-zacht bg-wit">
            {(donateurs.data ?? []).map((d) => (
              <li key={d.id} className="flex flex-col gap-1 p-4">
                <span className="font-bold">
                  {d.naam}
                  {d.organisatie ? ` · ${d.organisatie}` : ""}
                </span>
                <span className="tekst-klein text-tekst-zacht">
                  <a href={`mailto:${d.email}`} className="underline">
                    {d.email}
                  </a>{" "}
                  · looptijd: {d.looptijd} · {formatDatum(d.aangemaakt_op)}
                </span>
                {d.toelichting && <span className="whitespace-pre-line">{d.toelichting}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tutors">
        <h2 id="tutors" className="subtitel">
          Tutors
        </h2>
        {overig.length === 0 ? (
          <p className="mt-2 text-tekst-zacht">Nog geen beoordeelde tutors.</p>
        ) : (
          <ul className="mt-3 divide-y divide-rand-zacht rounded-[16px] border border-rand-zacht bg-wit">
            {overig.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span>
                  <span className="block font-bold">
                    {t.voornaam} {t.achternaam}
                  </span>
                  <span className="block tekst-klein text-tekst-zacht">
                    {emails.get(t.id)} · {t.status}
                    {t.beoordeeld_op ? ` sinds ${formatDatum(t.beoordeeld_op)}` : ""}
                  </span>
                </span>
                <form action={beoordeelTutor}>
                  <input type="hidden" name="tutorId" value={t.id} />
                  {t.status === "goedgekeurd" ? (
                    <>
                      <input type="hidden" name="status" value="geschorst" />
                      <GevaarKnop type="submit">Toegang pauzeren</GevaarKnop>
                    </>
                  ) : (
                    <>
                      <input type="hidden" name="status" value="goedgekeurd" />
                      <SecundaireKnop type="submit">Toegang geven</SecundaireKnop>
                    </>
                  )}
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
