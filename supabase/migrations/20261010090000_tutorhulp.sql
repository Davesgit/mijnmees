-- Fase 5a: tutorhulp. Tutors melden zich zelf aan; pas na goedkeuring door een beheerder zien ze hulpvragen.
-- Tutor- en beheerdershandelingen lopen via de server (datalaag met expliciete controles en gereduceerde velden).

create table public.beheerders (
  user_id uuid primary key references auth.users (id) on delete cascade,
  toegevoegd_op timestamptz not null default now()
);

create table public.tutors (
  id uuid primary key references auth.users (id) on delete cascade,
  voornaam text not null check (char_length(btrim(voornaam)) between 1 and 40),
  achternaam text not null check (char_length(btrim(achternaam)) between 1 and 60),
  ervaring text not null check (char_length(ervaring) between 1 and 1500),
  motivatie text not null check (char_length(motivatie) between 1 and 1500),
  afspraken_versie text not null,
  status text not null default 'aangemeld' check (status in ('aangemeld', 'goedgekeurd', 'afgewezen', 'geschorst')),
  aangemeld_op timestamptz not null default now(),
  beoordeeld_op timestamptz,
  beoordeeld_door uuid references auth.users (id) on delete set null
);

-- Kind laat ouder weten dat extra uitleg kan helpen (H01). Nog geen tutoraanvraag.
create table public.oudermeldingen (
  id uuid primary key default gen_random_uuid(),
  ouder_id uuid not null references public.ouders (id) on delete cascade,
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  leerdoel_id text not null,
  bewijs jsonb not null,
  criteria_versie integer not null,
  aangemaakt_op timestamptz not null default now(),
  afgehandeld_op timestamptz
);
create unique index oudermeldingen_open_uniek on public.oudermeldingen (kind_id, leerdoel_id) where afgehandeld_op is null;

-- Hulpvraag (O03 → tutor). Hooguit één open hulpvraag per kind en leerdoel.
create table public.hulpvragen (
  id uuid primary key default gen_random_uuid(),
  ouder_id uuid not null references public.ouders (id) on delete cascade,
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  leerdoel_id text not null,
  bewijs jsonb not null,
  criteria_versie integer not null,
  toestemming_versie text not null,
  status text not null default 'nieuw' check (status in ('nieuw', 'in-behandeling', 'uitleg-verstuurd', 'afgerond')),
  tutor_id uuid references public.tutors (id) on delete set null,
  geclaimd_op timestamptz,
  claim_tot timestamptz,
  uitleg_id uuid,
  controle_vraag_id text,
  afsluitreden text check (afsluitreden is null or char_length(afsluitreden) <= 500),
  aangemaakt_op timestamptz not null default now(),
  afgerond_op timestamptz
);
create unique index hulpvragen_open_uniek on public.hulpvragen (kind_id, leerdoel_id) where status <> 'afgerond';
create index hulpvragen_status_idx on public.hulpvragen (status, aangemaakt_op);

-- Uitleg met stem en tekenbord. Concept → gepubliceerd; audio staat in een private bucket.
create table public.uitleg (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  leerdoel_id text not null,
  hulpvraag_id uuid references public.hulpvragen (id) on delete set null,
  titel text not null check (char_length(titel) between 1 and 120),
  bord jsonb not null default '{"elementen": [], "gebeurtenissen": []}'::jsonb,
  audio_pad text,
  audio_mime text,
  duur_ms integer check (duur_ms is null or duur_ms between 0 and 900000),
  transcript text not null default '' check (char_length(transcript) <= 10000),
  status text not null default 'concept' check (status in ('concept', 'gepubliceerd')),
  versie integer not null default 1,
  privacy_gecontroleerd boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gepubliceerd_op timestamptz
);
create index uitleg_tutor_idx on public.uitleg (tutor_id, bijgewerkt_op desc);
alter table public.hulpvragen add constraint hulpvragen_uitleg_fk foreign key (uitleg_id) references public.uitleg (id) on delete set null;

-- Controlevraag na uitleg is een eigen sessiesoort.
alter table public.sessies drop constraint sessies_soort_check;
alter table public.sessies add constraint sessies_soort_check check (soort in ('oefening', 'tafels', 'europa', 'puzzel', 'niveau', 'controle'));

alter table public.beheerders enable row level security;
alter table public.tutors enable row level security;
alter table public.oudermeldingen enable row level security;
alter table public.hulpvragen enable row level security;
alter table public.uitleg enable row level security;

-- Tutor: eigen aanmelding lezen en eenmalig aanmaken (altijd als 'aangemeld'; de status zet alleen een beheerder).
create policy "tutor leest eigen aanmelding" on public.tutors for select to authenticated using (id = (select auth.uid()));
create policy "tutor meldt zich aan" on public.tutors for insert to authenticated
  with check (id = (select auth.uid()) and status = 'aangemeld' and beoordeeld_op is null and beoordeeld_door is null);

-- Ouder: eigen meldingen en hulpvragen lezen. Aanmaken loopt via de server (criteria en toestemming).
create policy "ouder leest eigen meldingen" on public.oudermeldingen for select to authenticated using (ouder_id = (select auth.uid()));
create policy "ouder leest eigen hulpvragen" on public.hulpvragen for select to authenticated using (ouder_id = (select auth.uid()));

revoke all on public.beheerders, public.tutors, public.oudermeldingen, public.hulpvragen, public.uitleg from anon;

-- Private opslag voor tutorstem. Alleen de server maakt upload- en afspeellinks.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uitleg-audio', 'uitleg-audio', false, 20971520, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav'])
on conflict (id) do nothing;
