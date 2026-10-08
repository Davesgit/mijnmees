-- Fase 5b: live-lessen. De tutor beslist; ouders geven per les toestemming; kinderen luisteren alleen
-- en stellen privévragen. Tutor-, kind- en lesacties lopen via de server met expliciete controles.

create table public.live_lessen (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  leerdoel_id text not null,
  titel text not null check (char_length(titel) between 1 and 120),
  start_op timestamptz not null,
  tijdzone text not null default 'Europe/Amsterdam',
  duur_min integer not null check (duur_min between 15 and 30),
  capaciteit integer not null default 20 check (capaciteit between 1 and 20),
  opnemen boolean not null default true,
  status text not null default 'gepland' check (status in ('gepland', 'live', 'afgelopen', 'geannuleerd')),
  room_naam text not null unique,
  vragen_gepauzeerd boolean not null default false,
  opname_uitleg_id uuid references public.uitleg (id) on delete set null,
  gestart_op timestamptz,
  geeindigd_op timestamptz,
  aangemaakt_op timestamptz not null default now()
);
create index live_lessen_tutor_idx on public.live_lessen (tutor_id, start_op desc);

create table public.les_uitnodigingen (
  id uuid primary key default gen_random_uuid(),
  les_id uuid not null references public.live_lessen (id) on delete cascade,
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  ouder_id uuid not null references public.ouders (id) on delete cascade,
  status text not null default 'uitgenodigd' check (status in ('uitgenodigd', 'toegestaan', 'geweigerd')),
  beleid_versie text,
  ouder_besluit_op timestamptz,
  kind_aanmelding text check (kind_aanmelding in ('ja', 'nee')),
  aangemeld_op timestamptz,
  aanwezig_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  unique (les_id, kind_id)
);
create index les_uitnodigingen_ouder_idx on public.les_uitnodigingen (ouder_id, aangemaakt_op desc);

-- Privévragen tijdens de les: alleen het eigen kind en de tutor van de les. Nooit gedeeld met andere kinderen.
create table public.les_vragen (
  id uuid primary key default gen_random_uuid(),
  les_id uuid not null references public.live_lessen (id) on delete cascade,
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  tekst text not null check (char_length(tekst) between 1 and 200),
  status text not null default 'nieuw' check (status in ('nieuw', 'apart', 'beantwoord')),
  reden text,
  aangemaakt_op timestamptz not null default now()
);
create index les_vragen_les_idx on public.les_vragen (les_id, aangemaakt_op);

-- Tutor zet een lesvoorstel tijdelijk opzij ("Nog geen les nodig"), met een feitelijke reden.
create table public.lesvoorstel_besluiten (
  id bigint generated always as identity primary key,
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  leerdoel_id text not null,
  reden text not null check (char_length(reden) between 1 and 300),
  tot timestamptz not null,
  op timestamptz not null default now()
);

alter table public.live_lessen enable row level security;
alter table public.les_uitnodigingen enable row level security;
alter table public.les_vragen enable row level security;
alter table public.lesvoorstel_besluiten enable row level security;

create policy "ouder leest eigen uitnodigingen" on public.les_uitnodigingen for select to authenticated using (ouder_id = (select auth.uid()));
create policy "ouder leest vragen van eigen kind" on public.les_vragen for select to authenticated using (public.is_eigen_kind(kind_id));

revoke all on public.live_lessen, public.les_uitnodigingen, public.les_vragen, public.lesvoorstel_besluiten from anon;

-- Aanmelden met een atomaire plekkencontrole: twee kinderen tegelijk kunnen de capaciteit niet overschrijden.
create function public.meld_aan_voor_les(p_les uuid, p_kind uuid) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  cap integer;
  st text;
  bezet integer;
begin
  select capaciteit, status into cap, st from public.live_lessen where id = p_les for update;
  if st is null or st not in ('gepland', 'live') then return 'gesloten'; end if;
  if exists (select 1 from public.les_uitnodigingen where les_id = p_les and kind_id = p_kind and kind_aanmelding = 'ja') then return 'al'; end if;
  select count(*) into bezet from public.les_uitnodigingen where les_id = p_les and kind_aanmelding = 'ja';
  if bezet >= cap then return 'vol'; end if;
  update public.les_uitnodigingen set kind_aanmelding = 'ja', aangemeld_op = now()
    where les_id = p_les and kind_id = p_kind and status = 'toegestaan';
  if not found then return 'geen-toestemming'; end if;
  return 'ok';
end;
$$;
revoke execute on function public.meld_aan_voor_les(uuid, uuid) from public, anon, authenticated;
