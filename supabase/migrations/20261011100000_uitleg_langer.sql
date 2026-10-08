-- Opnames van live-lessen kunnen langer zijn dan een korte uitleg (les tot 30 minuten + uitloop).
alter table public.uitleg drop constraint uitleg_duur_ms_check;
alter table public.uitleg add constraint uitleg_duur_ms_check check (duur_ms is null or duur_ms between 0 and 3600000);
-- Grotere audiobestanden (60 minuten bij 32 kbit/s ≈ 15 MB).
update storage.buckets set file_size_limit = 31457280 where id = 'uitleg-audio';
