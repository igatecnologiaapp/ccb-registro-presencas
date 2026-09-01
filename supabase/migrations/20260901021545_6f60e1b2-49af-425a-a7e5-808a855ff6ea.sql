-- 1) Tipo de evento
alter table public.events
  add column if not exists event_type text not null default 'reuniao_musical';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_event_type_check') then
    alter table public.events
      add constraint events_event_type_check
      check (event_type in ('treinamento','reuniao_musical','reuniao_ministerial','reuniao_colaboradores'));
  end if;
end $$;

-- 2) Setores
create table if not exists public.sectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.sectors to authenticated;
grant all on public.sectors to service_role;

alter table public.sectors enable row level security;

drop policy if exists sectors_select_auth on public.sectors;
create policy sectors_select_auth on public.sectors for select to authenticated using (true);
drop policy if exists sectors_admin_insert on public.sectors;
create policy sectors_admin_insert on public.sectors for insert to authenticated
  with check (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists sectors_admin_update on public.sectors;
create policy sectors_admin_update on public.sectors for update to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists sectors_admin_delete on public.sectors;
create policy sectors_admin_delete on public.sectors for delete to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role));

drop trigger if exists trg_sectors_updated on public.sectors;
create trigger trg_sectors_updated before update on public.sectors
  for each row execute function public.set_updated_at();

create index if not exists sectors_order_idx on public.sectors (display_order, name);

-- 3) Casa de Oração -> Setor
alter table public.prayer_houses
  add column if not exists sector_id uuid references public.sectors(id) on delete set null;
create index if not exists prayer_houses_sector_idx on public.prayer_houses (sector_id);

-- 4) Instrumento compartilhado (órgão)
alter table public.instruments
  add column if not exists is_shared boolean not null default false;
update public.instruments set is_shared = true where upper(name) like 'ÓRG%' or upper(name) like 'ORG_O%';

-- 5) Participantes de treinamento
create table if not exists public.training_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  prayer_house_id uuid not null references public.prayer_houses(id),
  full_name text not null,
  cpf text not null,
  birth_date date not null,
  function_id uuid not null references public.functions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.training_attendees to authenticated;
grant all on public.training_attendees to service_role;

alter table public.training_attendees enable row level security;

drop policy if exists training_attendees_select_auth on public.training_attendees;
create policy training_attendees_select_auth on public.training_attendees for select to authenticated using (true);
drop policy if exists training_attendees_auth_insert on public.training_attendees;
create policy training_attendees_auth_insert on public.training_attendees for insert to authenticated with check (true);
drop policy if exists training_attendees_auth_update on public.training_attendees;
create policy training_attendees_auth_update on public.training_attendees for update to authenticated using (true) with check (true);
drop policy if exists training_attendees_auth_delete on public.training_attendees;
create policy training_attendees_auth_delete on public.training_attendees for delete to authenticated using (true);

create index if not exists training_attendees_event_idx on public.training_attendees (event_id);
create index if not exists training_attendees_house_idx on public.training_attendees (prayer_house_id);

create or replace function public.validate_training_attendee()
returns trigger
language plpgsql
set search_path = public
as $$
declare v_type text; digits text;
begin
  select event_type into v_type from public.events where id = new.event_id;
  if v_type is distinct from 'treinamento' then
    raise exception 'Participantes de treinamento só podem ser vinculados a eventos do tipo Treinamento.';
  end if;

  digits := regexp_replace(coalesce(new.cpf,''), '[^0-9]', '', 'g');
  if length(digits) <> 11 then
    raise exception 'CPF inválido.';
  end if;
  new.cpf := digits;
  new.full_name := trim(new.full_name);
  return new;
end $$;

drop trigger if exists trg_training_attendees_validate on public.training_attendees;
create trigger trg_training_attendees_validate before insert or update on public.training_attendees
  for each row execute function public.validate_training_attendee();

drop trigger if exists trg_training_attendees_updated on public.training_attendees;
create trigger trg_training_attendees_updated before update on public.training_attendees
  for each row execute function public.set_updated_at();

-- 6) Limpeza de vínculos função x instrumento sem base (preservando os em uso)
delete from public.function_instruments fi
using public.functions f
where f.id = fi.function_id
  and upper(f.name) in ('INSTRUTOR','INSTRUTORA','EXAMINADORA','ENCARREGADO LOCAL','ENCARREGADO REGIONAL','ANCIÃO')
  and not exists (
    select 1 from public.attendees a
    where a.function_id = fi.function_id and a.instrument_id = fi.instrument_id
  );

-- 7) Indices de apoio
create index if not exists attendees_event_idx on public.attendees (event_id);
create index if not exists attendees_house_idx on public.attendees (prayer_house_id);
create index if not exists attendees_function_idx on public.attendees (function_id);