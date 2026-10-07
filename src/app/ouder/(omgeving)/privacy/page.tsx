import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { haalKinderen, vereisOntgrendeldeOuder } from "@/lib/server/dal";
import { UitlogKnop } from "../../UitlogKnop";
import { AccountVerwijderen, KindVerwijderen } from "./VerwijderFormulieren";

export const metadata: Metadata = { title: "Privacy en gegevens" };

export default function PrivacyOuderPage() {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-3xl tablet:py-10">
      <div>
        <h1 className="titel-held">Privacy en gegevens</h1>
        <p className="mt-2 tekst-intro text-tekst-zacht">Beheer de gegevens van je gezin.</p>
      </div>
      <Suspense fallback={<Laden />}>
        <Inhoud />
      </Suspense>
    </div>
  );
}

async function Inhoud() {
  await vereisOntgrendeldeOuder("/ouder/privacy");
  const kinderen = await haalKinderen();
  return (
    <>
      <section className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
        <h2 className="subtitel">Wat Mees bewaart</h2>
        <ul className="mt-3 flex list-disc flex-col gap-1 pl-6">
          <li>Jouw e-mailadres, om in te loggen.</li>
          <li>Per kind: voornaam, groep en het gekozen dier.</li>
          <li>Oefeningen, antwoorden, gebruikte hints en ontdekte weetjes.</li>
        </ul>
        <p className="mt-3 text-tekst-zacht">
          Geen advertenties en geen tracking. Een tutor ziet later nooit contactgegevens. Lees ook{" "}
          <Link href="/privacy" className="font-semibold text-actie-blauw underline underline-offset-4">
            privacy bij Mees
          </Link>
          .
        </p>
      </section>

      <section className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
        <h2 className="subtitel">Download je gegevens</h2>
        <p className="mt-1 text-tekst-zacht">Een bestand met alles wat Mees over je gezin bewaart.</p>
        {/* Gewone link: een download is geen client-navigatie. */}
        <a
          href="/ouder/privacy/export"
          download
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full border border-rand-interactief px-5 font-bold text-actie-blauw hover:bg-blauw-zacht"
        >
          <Icoon naam="download" />
          Download gegevens
        </a>
      </section>

      {kinderen.length > 0 && (
        <section className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
          <h2 className="subtitel">Een kinderprofiel verwijderen</h2>
          <p className="mt-1 text-tekst-zacht">Het profiel en alle voortgang worden meteen verwijderd. Dit kun je niet terugdraaien.</p>
          <ul className="mt-4 flex flex-col gap-3">
            {kinderen.map((k) => (
              <li key={k.id}>
                <KindVerwijderen kind={k} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
        <h2 className="subtitel">Je account verwijderen</h2>
        <p className="mt-1 text-tekst-zacht">Je account, alle kinderprofielen en alle voortgang worden verwijderd.</p>
        <AccountVerwijderen />
      </section>

      <UitlogKnop />
    </>
  );
}
