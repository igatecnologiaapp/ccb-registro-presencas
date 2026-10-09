ALTER TABLE public.events ADD COLUMN rehearsal_house_id uuid REFERENCES public.prayer_houses(id) ON DELETE RESTRICT;
COMMENT ON COLUMN public.events.rehearsal_house_id IS 'Real prayer-house association for Local do Ensaio; location remains the compatible display snapshot.';
CREATE INDEX events_rehearsal_house_idx ON public.events(rehearsal_house_id);
CREATE OR REPLACE FUNCTION public.validate_rehearsal_house() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE house public.prayer_houses%ROWTYPE;
BEGIN
  IF NEW.event_type <> 'ensaio_musical' THEN RETURN NEW; END IF;
  IF NEW.sector_id IS NULL THEN RAISE EXCEPTION 'Selecione o Setor do evento.'; END IF;
  IF NEW.rehearsal_house_id IS NULL THEN RAISE EXCEPTION 'Selecione o Local do Ensaio.'; END IF;
  SELECT * INTO house FROM public.prayer_houses WHERE id = NEW.rehearsal_house_id FOR SHARE;
  IF NOT FOUND OR NOT house.active THEN RAISE EXCEPTION 'O Local do Ensaio deve ser uma Casa de Oração ativa.'; END IF;
  IF house.sector_id IS DISTINCT FROM NEW.sector_id THEN RAISE EXCEPTION 'O Local do Ensaio deve pertencer ao Setor do evento.'; END IF;
  NEW.location := house.name;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_events_rehearsal_house BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.validate_rehearsal_house();