-- Voorlezen met ElevenLabs: elke tekst wordt één keer gemaakt en daarna uit de opslag afgespeeld.
-- De teksten zijn vaste lesinhoud (vragen, opties, weetjes), zonder persoonsgegevens; daarom een openbare bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voorlezen', 'voorlezen', true, 2097152, array['audio/mpeg'])
on conflict (id) do nothing;

-- Alleen nieuw gemaakte audio telt mee voor het dagbudget en de limiet per gebruiker (gehasht IP, geen IP-adres).
create table public.voorlees_verzoeken (
  id bigint generated always as identity primary key,
  bron text not null,
  tekens integer not null check (tekens between 1 and 2000),
  op timestamptz not null default now()
);
create index voorlees_verzoeken_op_idx on public.voorlees_verzoeken (op);
alter table public.voorlees_verzoeken enable row level security;
revoke all on public.voorlees_verzoeken from anon, authenticated;
