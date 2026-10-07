-- Fase 2: tafeltrainer, Europa (afwisselend en puzzel) en niveaubepaling.
alter table public.sessies
  add column soort text not null default 'oefening' check (soort in ('oefening', 'tafels', 'europa', 'puzzel', 'niveau')),
  add column instellingen jsonb not null default '{}'::jsonb;

-- Een Europa-selectie kan alle landen en onderwerpen omvatten (geen vaste 8 vragen).
alter table public.sessies drop constraint sessies_aantal_check;
alter table public.sessies add constraint sessies_aantal_check check (aantal between 1 and 400);

-- Actieve antwoordtijd (tafeltrainer); pauze en verborgen tabblad tellen niet mee.
alter table public.pogingen add column actieve_duur_ms integer check (actieve_duur_ms is null or actieve_duur_ms between 0 and 3600000);
