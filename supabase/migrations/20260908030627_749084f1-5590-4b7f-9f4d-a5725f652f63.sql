-- 1. profiles: email + situação de acesso
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

UPDATE public.profiles p
SET email = COALESCE(u.email, '')
FROM auth.users u
WHERE u.id = p.id AND p.email = '';

-- 2. helpers
CREATE OR REPLACE FUNCTION private.is_active_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select coalesce((select active from public.profiles where id = _user_id), false)
$$;

REVOKE ALL ON FUNCTION private.is_active_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_active_user(uuid) TO authenticated, service_role;

-- 3. admin pode administrar cadastros de usuários
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS user_roles_admin_update ON public.user_roles;
CREATE POLICY user_roles_admin_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- 4. escrita de presenças/treinamentos exige usuário ativo
DROP POLICY IF EXISTS attendees_auth_insert ON public.attendees;
CREATE POLICY attendees_auth_insert ON public.attendees
  FOR INSERT TO authenticated
  WITH CHECK (private.is_active_user(auth.uid()));

DROP POLICY IF EXISTS attendees_auth_update ON public.attendees;
CREATE POLICY attendees_auth_update ON public.attendees
  FOR UPDATE TO authenticated
  USING (private.is_active_user(auth.uid()))
  WITH CHECK (private.is_active_user(auth.uid()));

DROP POLICY IF EXISTS attendees_auth_delete ON public.attendees;
CREATE POLICY attendees_auth_delete ON public.attendees
  FOR DELETE TO authenticated
  USING (private.is_active_user(auth.uid()));

DROP POLICY IF EXISTS training_attendees_auth_insert ON public.training_attendees;
CREATE POLICY training_attendees_auth_insert ON public.training_attendees
  FOR INSERT TO authenticated
  WITH CHECK (private.is_active_user(auth.uid()));

DROP POLICY IF EXISTS training_attendees_auth_update ON public.training_attendees;
CREATE POLICY training_attendees_auth_update ON public.training_attendees
  FOR UPDATE TO authenticated
  USING (private.is_active_user(auth.uid()))
  WITH CHECK (private.is_active_user(auth.uid()));

DROP POLICY IF EXISTS training_attendees_auth_delete ON public.training_attendees;
CREATE POLICY training_attendees_auth_delete ON public.training_attendees
  FOR DELETE TO authenticated
  USING (private.is_active_user(auth.uid()));

-- 5. bootstrap grava e-mail do usuário autenticado
CREATE OR REPLACE FUNCTION public.bootstrap_current_user(_display_name text DEFAULT ''::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
  mail text := coalesce(auth.jwt() ->> 'email', '');
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, display_name, email)
  values (uid, coalesce(nullif(trim(_display_name), ''), ''), mail)
  on conflict (id) do update
    set display_name = case
          when nullif(trim(_display_name), '') is not null then trim(_display_name)
          else public.profiles.display_name end,
        email = case when mail <> '' then mail else public.profiles.email end;

  if not exists (select 1 from public.user_roles where user_id = uid) then
    if not exists (select 1 from public.user_roles) then
      insert into public.user_roles (user_id, role) values (uid, 'admin');
    else
      insert into public.user_roles (user_id, role) values (uid, 'operator');
    end if;
  end if;
end;
$function$;