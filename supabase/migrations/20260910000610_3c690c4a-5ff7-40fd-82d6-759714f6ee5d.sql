ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS all_prayer_houses boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION private.can_access_house(_user_id uuid, _house_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.is_active_user(_user_id)
    AND (
      private.has_role(_user_id, 'admin'::app_role)
      OR EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = _user_id
          AND (
            p.all_prayer_houses
            OR EXISTS (
              SELECT 1 FROM public.prayer_houses h
              WHERE h.id = _house_id
                AND h.sector_id IS NOT NULL
                AND h.sector_id = p.sector_id
            )
          )
      )
    )
$$;

REVOKE ALL ON FUNCTION private.can_access_house(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_access_house(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS attendees_auth_insert ON public.attendees;
DROP POLICY IF EXISTS attendees_auth_update ON public.attendees;
DROP POLICY IF EXISTS attendees_auth_delete ON public.attendees;

CREATE POLICY attendees_auth_insert ON public.attendees FOR INSERT TO authenticated
  WITH CHECK (private.can_access_house(auth.uid(), prayer_house_id));
CREATE POLICY attendees_auth_update ON public.attendees FOR UPDATE TO authenticated
  USING (private.can_access_house(auth.uid(), prayer_house_id))
  WITH CHECK (private.can_access_house(auth.uid(), prayer_house_id));
CREATE POLICY attendees_auth_delete ON public.attendees FOR DELETE TO authenticated
  USING (private.can_access_house(auth.uid(), prayer_house_id));

DROP POLICY IF EXISTS training_attendees_auth_insert ON public.training_attendees;
DROP POLICY IF EXISTS training_attendees_auth_update ON public.training_attendees;
DROP POLICY IF EXISTS training_attendees_auth_delete ON public.training_attendees;

CREATE POLICY training_attendees_auth_insert ON public.training_attendees FOR INSERT TO authenticated
  WITH CHECK (private.can_access_house(auth.uid(), prayer_house_id));
CREATE POLICY training_attendees_auth_update ON public.training_attendees FOR UPDATE TO authenticated
  USING (private.can_access_house(auth.uid(), prayer_house_id))
  WITH CHECK (private.can_access_house(auth.uid(), prayer_house_id));
CREATE POLICY training_attendees_auth_delete ON public.training_attendees FOR DELETE TO authenticated
  USING (private.can_access_house(auth.uid(), prayer_house_id));

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin'::app_role) OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.sector_id := OLD.sector_id;
  NEW.all_prayer_houses := OLD.all_prayer_houses;
  NEW.active := OLD.active;
  NEW.email := OLD.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileged_columns ON public.profiles;
CREATE TRIGGER guard_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();