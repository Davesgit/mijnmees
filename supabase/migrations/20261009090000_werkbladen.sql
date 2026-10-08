-- Fase 4: werkbladen en papierresultaten.
-- Een werkblad is onveranderlijk: vraag- en antwoordblad gebruiken dezelfde vraagversies.

create table public.werkbladen (
  id uuid primary key,
  code text not null unique check (code ~ '^WB-[A-Z0-9]{4,8}$'),
  ouder_id uuid not null references public.ouders (id) on delete cascade,
  kind_id uuid references public.kinderen (id) on delete set null,
  titel text not null check (char_length(titel) <= 120),
  instellingen jsonb not null,
  vragen jsonb not null,
  aangemaakt_op timestamptz not null default now()
);
create index werkbladen_ouder_idx on public.werkbladen (ouder_id, aangemaakt_op desc);

-- Papierresultaten: door de ouder ingevuld. Correcties zijn nieuwe versies; oude versies blijven bewaard.
create table public.papier_resultaten (
  id bigint generated always as identity primary key,
  werkblad_id uuid not null references public.werkbladen (id) on delete cascade,
  kind_id uuid not null references public.kinderen (id) on delete cascade,
  ouder_id uuid not null references public.ouders (id) on delete cascade,
  versie integer not null check (versie >= 1),
  regels jsonb not null,
  op timestamptz not null default now(),
  unique (werkblad_id, kind_id, versie)
);
create index papier_kind_idx on public.papier_resultaten (kind_id, op desc);

alter table public.werkbladen enable row level security;
alter table public.papier_resultaten enable row level security;

create policy "ouder leest eigen werkbladen" on public.werkbladen for select to authenticated using (ouder_id = (select auth.uid()));
create policy "ouder maakt werkblad" on public.werkbladen for insert to authenticated
  with check (ouder_id = (select auth.uid()) and (kind_id is null or public.is_eigen_kind(kind_id)));
create policy "ouder koppelt werkblad aan eigen kind" on public.werkbladen for update to authenticated
  using (ouder_id = (select auth.uid())) with check (ouder_id = (select auth.uid()) and (kind_id is null or public.is_eigen_kind(kind_id)));

create policy "ouder leest papierresultaten" on public.papier_resultaten for select to authenticated using (ouder_id = (select auth.uid()));
create policy "ouder registreert papierwerk" on public.papier_resultaten for insert to authenticated
  with check (
    ouder_id = (select auth.uid())
    and public.is_eigen_kind(kind_id)
    and exists (select 1 from public.werkbladen w where w.id = werkblad_id and w.ouder_id = (select auth.uid()))
  );

revoke all on public.werkbladen, public.papier_resultaten from anon;
