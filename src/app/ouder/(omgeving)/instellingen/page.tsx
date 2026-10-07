import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { ZachteKnop } from "@/components/mees/Knoppen";
import type { Kind } from "@/lib/kinderen";
import { vereisOntgrendeldeOuder } from "@/lib/server/dal";
import { createClient } from "@/lib/supabase/server";
import { UitlogKnop } from "../../UitlogKnop";
import { EmailVoorkeuren, KindInstellingen } from "./InstellingenFormulieren";

export const metadata: Metadata = { title: "Instellingen" };

export default function InstellingenPage() {
  return (
    <div className="mees-content flex flex-col gap-6 py-6 tablet:max-w-4xl tablet:py-10">
      <div>
        <h1 className="titel-held">Instellingen</h1>
        <p className="mt-2 tekst-intro text-tekst-zacht">Jij regelt het gebruik van Mees.</p>
      </div>
      <Suspense fallback={<Laden />}>
        <Inhoud />
      </Suspense>
    </div>
  );
}

async function Inhoud() {
  const ouder = await vereisOntgrendeldeOuder("/ouder/instellingen");
  const supabase = await createClient();
  const [{ data: kinderen }, { data: voorkeuren }] = await Promise.all([
    supabase.from("kinderen").select("id, voornaam, groep, avatar, tutorhulp_toegestaan").eq("ouder_id", ouder.id).order("aangemaakt_op"),
    supabase.from("ouders").select("email_uitleg, email_lessen").eq("id", ouder.id).single(),
  ]);

  return (
    <>
      <section aria-labelledby="kinderen-titel" className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="kinderen-titel" className="subtitel">Kinderen</h2>
            <p className="tekst-klein text-tekst-zacht">Beheer per kind het profiel.</p>
          </div>
          <ZachteKnop href="/ouder/kind-toevoegen">
            <Icoon naam="plus" />
            Kind toevoegen
          </ZachteKnop>
        </div>
        {(kinderen ?? []).length === 0 ? (
          <p>Je hebt nog geen kinderprofielen.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(kinderen as (Kind & { tutorhulp_toegestaan: boolean })[]).map((k) => (
              <li key={k.id}>
                <KindInstellingen kind={k} tutorhulp={k.tutorhulp_toegestaan} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="account-titel" className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
        <h2 id="account-titel" className="subtitel">Account</h2>
        <dl className="mt-4 divide-y divide-rand-zacht">
          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <dt className="font-bold">E-mailadres</dt>
            <dd className="text-tekst-zacht">{ouder.email}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <dt className="font-bold">Wachtwoord</dt>
            <dd>
              <Link href="/ouder/wachtwoord-herstellen" className="inline-flex min-h-12 items-center rounded-[12px] px-2 font-bold text-actie-blauw hover:bg-blauw-zacht">
                Wachtwoord wijzigen
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      <EmailVoorkeuren uitleg={voorkeuren?.email_uitleg ?? true} lessen={voorkeuren?.email_lessen ?? true} />

      <section aria-labelledby="apparaten-titel" className="rounded-[16px] border border-rand-zacht bg-wit p-5 tablet:p-6">
        <h2 id="apparaten-titel" className="subtitel">Apparaten</h2>
        <p className="mt-1 text-tekst-zacht">
          Elk apparaat waarop je bent ingelogd, kan de profielen van je kinderen openen. Op een gedeeld apparaat log je na het oefenen uit.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <UitlogKnop />
          <UitlogKnop overal label="Uitloggen op alle apparaten" />
        </div>
      </section>

      <Link href="/ouder/privacy" className="inline-flex min-h-12 items-center gap-2 self-start rounded-[12px] px-2 font-bold text-actie-blauw hover:bg-blauw-zacht">
        Privacy en gegevens
        <Icoon naam="pijl-rechts" />
      </Link>
    </>
  );
}
