CREATE FUNCTION public.transfer_authorized_vila_re_attendance() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE before_row jsonb; after_row jsonb;
BEGIN
  LOCK TABLE public.attendees IN SHARE ROW EXCLUSIVE MODE;
  SELECT to_jsonb(a)-'prayer_house_id' INTO before_row FROM public.attendees a WHERE id='57c2c8be-ce02-4202-87f1-d1e4db278893' AND event_id='d2fc8b2b-0fbe-47b1-b4f4-291f7fe734cb' AND prayer_house_id='db93560d-8e0c-401d-9944-b8eeea3140f6';
  IF before_row IS NULL THEN RAISE EXCEPTION 'Authorized attendance baseline differs'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.prayer_houses WHERE id='39ce658f-7eee-463b-9931-d9bea14518f6' AND active AND sector_id='e33fcd76-9713-4720-8ce3-c23592f67c16') THEN RAISE EXCEPTION 'Official house invalid'; END IF;
  ALTER TABLE public.attendees DISABLE TRIGGER trg_attendees_updated;
  UPDATE public.attendees SET prayer_house_id='39ce658f-7eee-463b-9931-d9bea14518f6' WHERE id='57c2c8be-ce02-4202-87f1-d1e4db278893';
  ALTER TABLE public.attendees ENABLE TRIGGER trg_attendees_updated;
  SELECT to_jsonb(a)-'prayer_house_id' INTO after_row FROM public.attendees a WHERE id='57c2c8be-ce02-4202-87f1-d1e4db278893';
  IF before_row IS DISTINCT FROM after_row THEN RAISE EXCEPTION 'Unauthorized attendance change'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.transfer_authorized_vila_re_attendance() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_authorized_vila_re_attendance() TO service_role;