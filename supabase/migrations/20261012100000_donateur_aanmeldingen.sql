-- Aanmeldingen voor meerjarige steun (vrijblijvend contactverzoek, geen betaling).
-- Alleen de server schrijft (met validatie en begrenzing); alleen de beheerder leest via het beheerdashboard.
create table public.donateur_aanmeldingen (
  id uuid primary key default gen_random_uuid(),
  naam text not null check (char_length(btrim(naam)) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  organisatie text check (organisatie is null or char_length(organisatie) <= 150),
  looptijd text not null check (looptijd in ('bespreken', '1-jaar', '2-jaar', '3-jaar', '5-jaar-of-langer')),
  toelichting text check (toelichting is null or char_length(toelichting) <= 1000),
  toestemming_contact boolean not null check (toestemming_contact),
  bron text not null,
  status text not null default 'nieuw' check (status in ('nieuw', 'benaderd', 'afgerond')),
  aangemaakt_op timestamptz not null default now()
);
create index donateur_aanmeldingen_op_idx on public.donateur_aanmeldingen (aangemaakt_op desc);
alter table public.donateur_aanmeldingen enable row level security;
revoke all on public.donateur_aanmeldingen from anon, authenticated;
