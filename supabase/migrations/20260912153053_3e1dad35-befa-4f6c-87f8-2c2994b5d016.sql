DROP POLICY IF EXISTS prayer_houses_select_auth ON public.prayer_houses;
CREATE POLICY prayer_houses_select_auth
ON public.prayer_houses
FOR SELECT
TO authenticated
USING (private.can_access_house(auth.uid(), id));

DROP POLICY IF EXISTS attendees_select_auth ON public.attendees;
CREATE POLICY attendees_select_auth
ON public.attendees
FOR SELECT
TO authenticated
USING (private.can_access_house(auth.uid(), prayer_house_id));

DROP POLICY IF EXISTS training_attendees_select_auth ON public.training_attendees;
CREATE POLICY training_attendees_select_auth
ON public.training_attendees
FOR SELECT
TO authenticated
USING (private.can_access_house(auth.uid(), prayer_house_id));