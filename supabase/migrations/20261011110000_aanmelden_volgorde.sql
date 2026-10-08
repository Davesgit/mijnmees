-- Eerst toestemming controleren, dan pas de plekken: zo klopt de melding voor een kind zonder toestemming.
create or replace function public.meld_aan_voor_les(p_les uuid, p_kind uuid) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  cap integer;
  st text;
  bezet integer;
begin
  select capaciteit, status into cap, st from public.live_lessen where id = p_les for update;
  if st is null or st not in ('gepland', 'live') then return 'gesloten'; end if;
  if not exists (select 1 from public.les_uitnodigingen where les_id = p_les and kind_id = p_kind and status = 'toegestaan') then return 'geen-toestemming'; end if;
  if exists (select 1 from public.les_uitnodigingen where les_id = p_les and kind_id = p_kind and kind_aanmelding = 'ja') then return 'al'; end if;
  select count(*) into bezet from public.les_uitnodigingen where les_id = p_les and kind_aanmelding = 'ja';
  if bezet >= cap then return 'vol'; end if;
  update public.les_uitnodigingen set kind_aanmelding = 'ja', aangemeld_op = now() where les_id = p_les and kind_id = p_kind;
  return 'ok';
end;
$$;
revoke execute on function public.meld_aan_voor_les(uuid, uuid) from public, anon, authenticated;
