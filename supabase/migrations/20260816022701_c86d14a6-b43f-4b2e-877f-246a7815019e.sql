-- enum for future roles
create type public.app_role as enum ('admin','operator');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  start_time time not null default '09:00',
  location text not null default '',
  status text not null default 'aberto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.events to anon, authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "events_public_all" on public.events for all to anon, authenticated using (true) with check (true);

create table public.functions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.functions to anon, authenticated;
grant all on public.functions to service_role;
alter table public.functions enable row level security;
create policy "functions_public_all" on public.functions for all to anon, authenticated using (true) with check (true);

create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.instruments to anon, authenticated;
grant all on public.instruments to service_role;
alter table public.instruments enable row level security;
create policy "instruments_public_all" on public.instruments for all to anon, authenticated using (true) with check (true);

create table public.prayer_houses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.prayer_houses to anon, authenticated;
grant all on public.prayer_houses to service_role;
alter table public.prayer_houses enable row level security;
create policy "prayer_houses_public_all" on public.prayer_houses for all to anon, authenticated using (true) with check (true);

create table public.function_instruments (
  id uuid primary key default gen_random_uuid(),
  function_id uuid not null references public.functions(id) on delete cascade,
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (function_id, instrument_id)
);
grant select, insert, update, delete on public.function_instruments to anon, authenticated;
grant all on public.function_instruments to service_role;
alter table public.function_instruments enable row level security;
create policy "function_instruments_public_all" on public.function_instruments for all to anon, authenticated using (true) with check (true);
create index idx_fi_function on public.function_instruments(function_id);
create index idx_fi_instrument on public.function_instruments(instrument_id);

create table public.attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  prayer_house_id uuid not null references public.prayer_houses(id) on delete restrict,
  function_id uuid not null references public.functions(id) on delete restrict,
  instrument_id uuid references public.instruments(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.attendees to anon, authenticated;
grant all on public.attendees to service_role;
alter table public.attendees enable row level security;
create policy "attendees_public_all" on public.attendees for all to anon, authenticated using (true) with check (true);
create index idx_att_event on public.attendees(event_id);
create index idx_att_house on public.attendees(prayer_house_id);
create index idx_att_function on public.attendees(function_id);
create index idx_att_instrument on public.attendees(instrument_id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "user_roles_read_own" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_events_updated before update on public.events for each row execute function public.set_updated_at();
create trigger trg_functions_updated before update on public.functions for each row execute function public.set_updated_at();
create trigger trg_instruments_updated before update on public.instruments for each row execute function public.set_updated_at();
create trigger trg_prayer_houses_updated before update on public.prayer_houses for each row execute function public.set_updated_at();
create trigger trg_attendees_updated before update on public.attendees for each row execute function public.set_updated_at();

-- integrity: instrument must be linked to the function
create or replace function public.validate_attendee()
returns trigger language plpgsql set search_path = public as $$
declare linked_count int;
begin
  select count(*) into linked_count from public.function_instruments where function_id = new.function_id;
  if new.instrument_id is null then
    if linked_count > 0 then
      raise exception 'A função selecionada exige um instrumento.';
    end if;
  else
    if not exists (select 1 from public.function_instruments where function_id = new.function_id and instrument_id = new.instrument_id) then
      raise exception 'O instrumento informado não está vinculado à função selecionada.';
    end if;
  end if;
  return new;
end; $$;

create trigger trg_attendees_validate before insert or update on public.attendees for each row execute function public.validate_attendee();

-- seed data from the reference document
insert into public.functions (name) values ('INSTRUTOR'),('ENCARREGADO LOCAL'),('INSTRUTORA'),('SECRETÁRIO DA MÚSICA'),('ENCARREGADO REGIONAL'),('ANCIÃO'),('EXAMINADORA'),('COLABORADORES LOCAIS'),('MÚSICO'),('ORGANISTA'),('OUTRAS FUNÇÕES'),('REGISTRO DE PRESENÇA'),('COOPERADOR OFICIAL'),('DIÁCONO') on conflict (name) do nothing;

insert into public.instruments (name) values ('VIOLINO'),('TUBA'),('SAXOFONE ALTO'),('ÓRGÃO'),('TROMPETE'),('TROMBONE/TROMBONITO'),('VIOLONCELO'),('FLAUTA TRANSVERSAL'),('CLARINETE'),('SAXOFONE TENOR'),('VIOLA'),('EUFONIO'),('SAXOFONE BARÍTONO'),('SAXOFONE SOPRANO'),('OBOÉ'),('CLARINETE BAIXO'),('FAGOTE'),('FLUGELHORN'),('TROMPA'),('CORNE INGLÊS'),('CLARINETE ALTO'),('BARÍTONO') on conflict (name) do nothing;

insert into public.prayer_houses (name) values ('PARQUE GUARANI'),('GUAIANAZES - CENTRAL'),('VILA GUILHERMINA'),('CIDADE A E CARVALHO'),('ERMELINO MATARAZZO'),('JARDIM BELEM'),('JARDIM MARILIA'),('CIDADE TIRADENTES CENTRAL'),('JARDIM DAS OLIVEIRAS'),('JARDIM SAO CARLOS'),('VILA SALETE'),('VILA VERDE'),('JARDIM BANDEIRANTES'),('JARDIM SAO PAULO'),('PARQUE MARIA LUIZA'),('PARQUE PAULISTANO'),('PENHA'),('QUINZE DE NOVEMBRO'),('VILA ARICANDUVA'),('VILA COSMOPOLITA'),('VILA CURUCA VELHA'),('ARTUR ALVIM'),('C. A. E. CARVALHO GLEBA 4'),('JARDIM ETELVINA'),('JARDIM FLAVIO'),('JARDIM SAMARA'),('PARQUE CRUZEIRO DO SUL'),('VILA PROGRESSO'),('VILA REGINA'),('VILA SANTA TEREZINHA'),('BURGO PAULISTA'),('GLEBA IV'),('ITAQUERA CENTRAL'),('JARDIM HELENA'),('JARDIM LOURDES'),('JARDIM SAO GERALDO'),('JARDIM SAO PEDRO'),('JARDIM VERONIA'),('JARDIM WILMA FLOR'),('PARQUE GUAIANAZES'),('PARQUE SAVOY CITY'),('VILA BEATRIZ'),('VILA COSTA MELLO'),('VILA MARILENA'),('VILA REIS'),('VILA YOLANDA'),('CIDADE LIDER'),('CIDADE TIRADENTES - SETOR C 19'),('CIDADE TIRADENTES - SETOR G'),('CJ JUSCELINO KUBITSCHEK'),('COHAB JUSCELINO'),('CONJUNTO PRESTES MAIA'),('GLEBA DO PESSEGO'),('JARDIM FANGANIELLO'),('SÃO MIGUEL PAULISTA'),('SITIO CONCEIÇÃO'),('SOCORRO CENTRAL'),('VILA ARAGUAIA'),('VILA CARLOS DE CAMPOS'),('VILA LAUREA'),('VILA MONTE SANTO'),('VILA NHOCUNÉ'),('VILA NOVA CURUÇÁ'),('VILA RE'),('VILA SAO VICENTE'),('VILA VESSONI'),('CIDADE KEMEL II'),('CIDADE NOVA SAO MIGUEL'),('ITAIM PAULISTA CENTRAL'),('JARDIM BANDEIRANTES FERRAZ'),('JARDIM CAMARGO NOVO'),('JARDIM KERALUX'),('JARDIM MABEL'),('JARDIM MARINGA'),('JARDIM NAIR'),('JARDIM NORDESTE'),('JARDIM NORMA'),('JARDIM PEROLA II'),('JARDIM RENI'),('JARDIM ROBRU'),('PARQUE BOTURUSSU'),('PARQUE DO CARMO II'),('PARQUE SAVOY CITY II'),('PEDRO NUNES'),('UNIAO DE VILA NOVA'),('UNIÃO VILA NOVA'),('VILA CHUCA'),('VILA RAMOS'),('VILA SEABRA'),('VILA SILVIA'),('VILA SOLANGE'),('CENTRAL GUAIANAZES'),('CENTRAL GUAINASES'),('CIDADE TIRADENTES - SETOR D'),('COHAB I'),('ENGENHEIRO GOULART'),('GLEBA 3'),('JARDIM DANFER'),('JARDIM DOS YPES'),('JARDIM ELIANE'),('JARDIM FLÁVIO'),('JARDIM GIANETTI'),('JARDIM HELENA - FERRAZ DE VASCONCELOS'),('JARDIM LAJEADO'),('JARDIM LIGIA'),('JARDIM MARÍLIA'),('JARDIM NOVO HORIZONTE'),('JARDIM ROMANO'),('KM 18 - OSASCO'),('PARQUE ECOLÓGICO'),('PARQUE GUAIANASES'),('PARQUE JANDAIA'),('PARQUE JANDÁIA'),('PARQUE SANTA RITA'),('PONTE RASA'),('SERRA NEGRA JARDIM DO SALTO'),('VILA CARMOSINA'),('VILA NITRO QUIMICA'),('VILA RÉ'),('VILA SILVER'),('BARRO BRANCO II'),('CANGAIBA'),('CHÁCARA ALELUIA'),('CIDADE PEDRO JOSE NUNES'),('CIDADE TIRADENTES - SETOR C 88'),('COMUNIDADE NOVA VITÓRIA'),('JARDIM AURORA'),('JARDIM CAMPOS'),('JARDIM CIBELE'),('JARDIM IRENE'),('JARDIM LAURA'),('JARDIM NAZARE'),('JARDIM NELIA'),('JARDIM NOSSA SENHORA DO CARMO'),('JARDIM PEDRA BRANCA'),('JARDIM SOUZA RAMOS'),('JARDIM TRES MARIAS'),('PARQUE DO CARMO III'),('VILA BUENOS AIRES'),('VILA CISPER'),('VILA ITAIM'),('VILA LOURDES'),('VILA PAULISTA'),('VILA YOLANDA II') on conflict (name) do nothing;

-- suggested, fully editable function x instrument matrix
insert into public.function_instruments (function_id, instrument_id)
select f.id, i.id from public.functions f, public.instruments i
where f.name in ('MÚSICO','INSTRUTOR','INSTRUTORA') and i.name <> 'ÓRGÃO'
on conflict do nothing;

insert into public.function_instruments (function_id, instrument_id)
select f.id, i.id from public.functions f, public.instruments i
where f.name in ('ORGANISTA','EXAMINADORA') and i.name = 'ÓRGÃO'
on conflict do nothing;

-- initial event from the reference document
insert into public.events (name, date, start_time, location, status)
values ('Reunião Técnica Musical', '2026-06-21', '09:00', 'Parque Guarani', 'aberto');