-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_select_admin" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

-- BOOTSTRAP: cria perfil e atribui papel (primeiro usuario = admin)
create or replace function public.bootstrap_current_user(_display_name text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, display_name)
  values (uid, coalesce(nullif(trim(_display_name), ''), ''))
  on conflict (id) do update
    set display_name = case
      when nullif(trim(_display_name), '') is not null then trim(_display_name)
      else public.profiles.display_name end;

  if not exists (select 1 from public.user_roles where user_id = uid) then
    if not exists (select 1 from public.user_roles) then
      insert into public.user_roles (user_id, role) values (uid, 'admin');
    else
      insert into public.user_roles (user_id, role) values (uid, 'operator');
    end if;
  end if;
end;
$$;

revoke execute on function public.bootstrap_current_user(text) from public, anon;
grant execute on function public.bootstrap_current_user(text) to authenticated;

-- USER ROLES: admins gerenciam
create policy "user_roles_admin_select" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_insert" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_delete" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

grant insert, delete on public.user_roles to authenticated;

-- REMOVE ACESSO PUBLICO
drop policy if exists events_public_all on public.events;
drop policy if exists functions_public_all on public.functions;
drop policy if exists instruments_public_all on public.instruments;
drop policy if exists prayer_houses_public_all on public.prayer_houses;
drop policy if exists function_instruments_public_all on public.function_instruments;
drop policy if exists attendees_public_all on public.attendees;

revoke all on public.events from anon;
revoke all on public.functions from anon;
revoke all on public.instruments from anon;
revoke all on public.prayer_houses from anon;
revoke all on public.function_instruments from anon;
revoke all on public.attendees from anon;

grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.functions to authenticated;
grant select, insert, update, delete on public.instruments to authenticated;
grant select, insert, update, delete on public.prayer_houses to authenticated;
grant select, insert, update, delete on public.function_instruments to authenticated;
grant select, insert, update, delete on public.attendees to authenticated;

-- LEITURA: qualquer usuario autenticado
create policy "events_select_auth" on public.events for select to authenticated using (true);
create policy "functions_select_auth" on public.functions for select to authenticated using (true);
create policy "instruments_select_auth" on public.instruments for select to authenticated using (true);
create policy "prayer_houses_select_auth" on public.prayer_houses for select to authenticated using (true);
create policy "function_instruments_select_auth" on public.function_instruments for select to authenticated using (true);
create policy "attendees_select_auth" on public.attendees for select to authenticated using (true);

-- ESCRITA DE CADASTROS: somente admin
create policy "events_admin_insert" on public.events for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "events_admin_update" on public.events for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "events_admin_delete" on public.events for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "functions_admin_insert" on public.functions for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "functions_admin_update" on public.functions for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "functions_admin_delete" on public.functions for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "instruments_admin_insert" on public.instruments for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "instruments_admin_update" on public.instruments for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "instruments_admin_delete" on public.instruments for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "prayer_houses_admin_insert" on public.prayer_houses for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "prayer_houses_admin_update" on public.prayer_houses for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "prayer_houses_admin_delete" on public.prayer_houses for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "function_instruments_admin_insert" on public.function_instruments for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "function_instruments_admin_delete" on public.function_instruments for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- PRESENCAS: operador e admin
create policy "attendees_auth_insert" on public.attendees for insert to authenticated with check (true);
create policy "attendees_auth_update" on public.attendees for update to authenticated using (true) with check (true);
create policy "attendees_auth_delete" on public.attendees for delete to authenticated using (true);