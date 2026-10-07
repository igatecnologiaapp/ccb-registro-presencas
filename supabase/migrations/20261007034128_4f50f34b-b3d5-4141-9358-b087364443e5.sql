ALTER TABLE public.events ADD COLUMN sector_id uuid REFERENCES public.sectors(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_events_sector_id ON public.events(sector_id);

CREATE OR REPLACE FUNCTION public.check_event_sector_house(_event_id uuid, _house_id uuid)
RETURNS void LANGUAGE plpgsql STABLE SET search_path TO 'public' AS $$
DECLARE ev_sector uuid; house_sector uuid;
BEGIN
  SELECT sector_id INTO ev_sector FROM public.events WHERE id = _event_id;
  IF ev_sector IS NULL THEN RETURN; END IF;
  SELECT sector_id INTO house_sector FROM public.prayer_houses WHERE id = _house_id;
  IF house_sector IS DISTINCT FROM ev_sector THEN
    RAISE EXCEPTION 'A Casa de Oração selecionada não pertence ao Setor deste evento.';
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.validate_event_sector_house()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.prayer_house_id IS DISTINCT FROM OLD.prayer_house_id
     OR NEW.event_id IS DISTINCT FROM OLD.event_id THEN
    PERFORM public.check_event_sector_house(NEW.event_id, NEW.prayer_house_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_attendees_event_sector BEFORE INSERT OR UPDATE ON public.attendees
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_sector_house();
CREATE TRIGGER trg_training_attendees_event_sector BEFORE INSERT OR UPDATE ON public.training_attendees
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_sector_house();