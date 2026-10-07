-- Fase 3: ouderaccounts, kinderprofielen en voortgang.
-- Alles staat standaard dicht (RLS aan, geen policy = geen toegang).
-- Ouders lezen hun eigen gezin. Schrijven van voortgang gaat via de server (service role),
-- zodat antwoorden server-side beoordeeld worden en een browser nooit zelf "goed" kan melden.

-- Ouder: één rij per Supabase-gebruiker. E-mail blijft bij de authprovider.
create table public.ouders (
  id uuid primary key references auth.users (id) on delete cascade,
  verklaring_versie text not null,
  verklaring_op timestamptz not null default now(),
  email_uitleg boolean not null default true,
  email_lessen boolean not null default true,
  aangemaakt_op timestamptz not null default now()
);

-- Kinderprofiel: alleen voornaam, groep en gekozen dier. Geen achternaam, geboortedatum of foto.
create table public.kinderen (
  id uuid primary key default gen_random_uuid(),
  ouder_id uuid not null references public.ouders (id) on delete cascade,
  voornaam text not null check (char_length(btrim(voornaam)) between 1 and 30),
  groep smallint not null check (groep between 5 and 8),
  avatar text not null check (avatar in ('vos', 'uil', 'kat', 'beer', 'konijn', 'panda')),
  tutorhulp_toegestaan boolean not null default false,
  leesinstellingen jsonb not null default '{}'::jsonb,
  aangemaakt_op timestamptz not null default now()
);
create index kinderen_ouder_idx on public.kinderen (ouder_id);

-- Historie van toestemmingen (bijv. tutorhulp); nooit overschrijven.
create table public.toestemmingen (
  id bigint generated always as identity primary key,
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  ouder_id uuid not null references public.ouders (id) on delete cascade,
  soort text not null check (soort in ('tutorhulp')),
  waarde boolean not null,
  beleid_versie text not null,
  op timestamptz not null default now()
);
create index toestemmingen_kind_idx on public.toestemmingen (kind_id);

-- Oefensessie: id wordt op het apparaat gemaakt (werkt ook offline); versie voorkomt overschrijven met oudere data.
create table public.sessies (
  id uuid primary key,
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  leerdoel_id text not null,
  onderdeel_id text not null,
  onderwerp_id text not null,
  niveau text not null check (niveau in ('makkelijk', 'past-bij-mij', 'uitdagend')),
  aantal smallint not null check (aantal between 1 and 40),
  bron text not null check (bron in ('voorstel', 'zelf')),
  slots jsonb not null,
  huidige_index smallint not null default 0,
  versie integer not null default 1,
  status text not null check (status in ('bezig', 'afgerond')),
  gestart_op timestamptz not null,
  afgerond_op timestamptz,
  bijgewerkt_op timestamptz not null default now()
);
create index sessies_kind_idx on public.sessies (kind_id, gestart_op desc);

-- Poging: append-only, uniek per event-id (idempotent), resultaat bepaald door de server.
create table public.pogingen (
  event_id uuid primary key,
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  sessie_id uuid not null references public.sessies (id) on delete cascade,
  slot_id uuid not null,
  vraag_id text not null,
  vraag_versie integer not null,
  leerdoel_id text not null,
  antwoord text not null check (char_length(antwoord) <= 200),
  resultaat text not null check (resultaat in ('goed', 'fout')),
  eerste_poging boolean not null,
  hulp_hints smallint not null check (hulp_hints between 0 and 2),
  hulp_uitleg boolean not null,
  bron text not null default 'digitaal' check (bron in ('digitaal', 'papier')),
  op timestamptz not null,
  ontvangen_op timestamptz not null default now()
);
create index pogingen_kind_idx on public.pogingen (kind_id, op desc);
create index pogingen_sessie_idx on public.pogingen (sessie_id);

-- Weetjes: één per kind per weetje, en hooguit één nieuw weetje per kalenderdag.
create table public.weetjes_ontdekt (
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  weetje_id text not null,
  sessie_id uuid not null references public.sessies (id) on delete cascade,
  dag date not null,
  op timestamptz not null,
  primary key (kind_id, weetje_id),
  unique (kind_id, dag)
);

-- Openstaande herhaling voor de volgende sessie van een leerdoel.
create table public.reviews (
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  leerdoel_id text not null,
  van_sessie_id uuid not null,
  op timestamptz not null,
  primary key (kind_id, leerdoel_id)
);

-- Minimale audit: wie deed wat met welk object. Geen antwoorden of contactgegevens.
create table public.audit (
  id bigint generated always as identity primary key,
  ouder_id uuid,
  handeling text not null,
  object_id text,
  op timestamptz not null default now()
);

alter table public.ouders enable row level security;
alter table public.kinderen enable row level security;
alter table public.toestemmingen enable row level security;
alter table public.sessies enable row level security;
alter table public.pogingen enable row level security;
alter table public.weetjes_ontdekt enable row level security;
alter table public.reviews enable row level security;
alter table public.audit enable row level security;

-- Hulpfunctie: hoort dit kind bij de ingelogde ouder?
create function public.is_eigen_kind(kind uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.kinderen k where k.id = kind and k.ouder_id = (select auth.uid()));
$$;
revoke execute on function public.is_eigen_kind(uuid) from public, anon;
grant execute on function public.is_eigen_kind(uuid) to authenticated;

-- Ouder: eigen rij lezen en voorkeuren wijzigen.
create policy "ouder leest eigen rij" on public.ouders for select to authenticated using (id = (select auth.uid()));
create policy "ouder maakt eigen rij" on public.ouders for insert to authenticated with check (id = (select auth.uid()));
create policy "ouder wijzigt eigen voorkeuren" on public.ouders for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Kinderen: eigen gezin beheren.
create policy "ouder leest eigen kinderen" on public.kinderen for select to authenticated using (ouder_id = (select auth.uid()));
create policy "ouder voegt kind toe" on public.kinderen for insert to authenticated with check (ouder_id = (select auth.uid()));
create policy "ouder wijzigt eigen kind" on public.kinderen for update to authenticated
  using (ouder_id = (select auth.uid())) with check (ouder_id = (select auth.uid()));
create policy "ouder verwijdert eigen kind" on public.kinderen for delete to authenticated using (ouder_id = (select auth.uid()));

-- Toestemmingen: lezen en toevoegen voor eigen kinderen; nooit wijzigen.
create policy "ouder leest toestemmingen" on public.toestemmingen for select to authenticated using (ouder_id = (select auth.uid()));
create policy "ouder geeft toestemming" on public.toestemmingen for insert to authenticated
  with check (ouder_id = (select auth.uid()) and public.is_eigen_kind(kind_id));

-- Voortgang: alleen lezen voor de ouder. Schrijven gebeurt server-side na controle.
create policy "ouder leest sessies" on public.sessies for select to authenticated using (public.is_eigen_kind(kind_id));
create policy "ouder leest pogingen" on public.pogingen for select to authenticated using (public.is_eigen_kind(kind_id));
create policy "ouder leest weetjes" on public.weetjes_ontdekt for select to authenticated using (public.is_eigen_kind(kind_id));
create policy "ouder leest reviews" on public.reviews for select to authenticated using (public.is_eigen_kind(kind_id));
-- audit: geen policies; alleen de server schrijft.

-- Anonieme bezoekers krijgen nergens toegang toe.
revoke all on all tables in schema public from anon;
