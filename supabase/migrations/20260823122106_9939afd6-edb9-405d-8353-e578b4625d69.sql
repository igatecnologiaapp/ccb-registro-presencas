CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;

ALTER POLICY profiles_select_admin ON public.profiles USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY user_roles_admin_select ON public.user_roles USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY user_roles_admin_insert ON public.user_roles WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY user_roles_admin_delete ON public.user_roles USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY events_admin_insert ON public.events WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY events_admin_update ON public.events USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY events_admin_delete ON public.events USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY functions_admin_insert ON public.functions WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY functions_admin_update ON public.functions USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY functions_admin_delete ON public.functions USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY instruments_admin_insert ON public.instruments WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY instruments_admin_update ON public.instruments USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY instruments_admin_delete ON public.instruments USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY prayer_houses_admin_insert ON public.prayer_houses WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY prayer_houses_admin_update ON public.prayer_houses USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY prayer_houses_admin_delete ON public.prayer_houses USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY function_instruments_admin_insert ON public.function_instruments WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY function_instruments_admin_delete ON public.function_instruments USING (private.has_role(auth.uid(), 'admin'::public.app_role));