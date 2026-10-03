CREATE OR REPLACE FUNCTION public.normalize_participant_name(_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(regexp_replace(
    translate(lower(coalesce(_value, '')),
      'áàâãäéèêëíìîïóòôõöúùûüç',
      'aaaaaeeeeiiiiooooouuuuc'),
    '\s+', ' ', 'g'))
$$;

REVOKE ALL ON FUNCTION public.normalize_participant_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_participant_name(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_participant_name(text) TO service_role;

CREATE TABLE public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participants TO authenticated;
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY participants_select_active_user ON public.participants
FOR SELECT TO authenticated
USING (private.is_active_user(auth.uid()));

CREATE POLICY participants_insert_active_user ON public.participants
FOR INSERT TO authenticated
WITH CHECK (private.is_active_user(auth.uid()) AND created_by = auth.uid());

CREATE POLICY participants_update_admin ON public.participants
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY participants_delete_admin ON public.participants
FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX participants_normalized_name_idx ON public.participants(normalized_name);
CREATE INDEX participants_active_idx ON public.participants(active);

CREATE OR REPLACE FUNCTION public.validate_participant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  digits text;
BEGIN
  NEW.name := trim(regexp_replace(coalesce(NEW.name, ''), '\s+', ' ', 'g'));
  IF NEW.name = '' OR char_length(NEW.name) > 150 THEN
    RAISE EXCEPTION 'Informe um nome válido com até 150 caracteres.';
  END IF;
  NEW.normalized_name := public.normalize_participant_name(NEW.name);
  digits := regexp_replace(coalesce(NEW.phone, ''), '[^0-9]', '', 'g');
  IF digits <> '' AND length(digits) NOT IN (10, 11) THEN
    RAISE EXCEPTION 'Fone/WhatsApp inválido.';
  END IF;
  NEW.phone := nullif(digits, '');
  IF TG_OP = 'INSERT' AND NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_participant() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_participant() FROM anon;
REVOKE ALL ON FUNCTION public.validate_participant() FROM authenticated;

CREATE TRIGGER trg_participants_validate
BEFORE INSERT OR UPDATE ON public.participants
FOR EACH ROW EXECUTE FUNCTION public.validate_participant();

CREATE TRIGGER trg_participants_updated
BEFORE UPDATE ON public.participants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.events
  ADD COLUMN public_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX events_public_token_key ON public.events(public_token);

ALTER TABLE public.attendees
  ADD COLUMN participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL,
  ADD COLUMN phone text;
CREATE INDEX attendees_participant_id_idx ON public.attendees(participant_id);

CREATE OR REPLACE FUNCTION private.event_is_open(_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND status = 'aberto'
  )
$$;

REVOKE ALL ON FUNCTION private.event_is_open(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.event_is_open(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_attendee()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  linked_count int;
  event_kind text;
  event_status text;
  participant_row public.participants%ROWTYPE;
  digits text;
BEGIN
  SELECT event_type, status INTO event_kind, event_status
  FROM public.events WHERE id = NEW.event_id;
  IF event_kind IS NULL THEN
    RAISE EXCEPTION 'Evento inválido.';
  END IF;
  IF event_kind = 'treinamento' THEN
    RAISE EXCEPTION 'Use o formulário de treinamento para este evento.';
  END IF;
  IF event_status <> 'aberto' THEN
    RAISE EXCEPTION 'Este evento não está disponível para novos registros.';
  END IF;

  NEW.name := trim(regexp_replace(coalesce(NEW.name, ''), '\s+', ' ', 'g'));
  IF char_length(NEW.name) > 150 THEN
    RAISE EXCEPTION 'O nome deve ter até 150 caracteres.';
  END IF;

  digits := regexp_replace(coalesce(NEW.phone, ''), '[^0-9]', '', 'g');
  IF digits <> '' AND length(digits) NOT IN (10, 11) THEN
    RAISE EXCEPTION 'Fone/WhatsApp inválido.';
  END IF;
  NEW.phone := nullif(digits, '');

  IF NEW.participant_id IS NOT NULL THEN
    SELECT * INTO participant_row FROM public.participants
    WHERE id = NEW.participant_id AND active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Participante inválido ou inativo.';
    END IF;
    IF NEW.name = '' THEN NEW.name := participant_row.name; END IF;
    IF NEW.phone IS NULL THEN NEW.phone := participant_row.phone; END IF;
  END IF;

  SELECT count(*) INTO linked_count
  FROM public.function_instruments WHERE function_id = NEW.function_id;
  IF NEW.instrument_id IS NULL THEN
    IF linked_count > 0 THEN
      RAISE EXCEPTION 'A função selecionada exige um instrumento.';
    END IF;
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.function_instruments
    WHERE function_id = NEW.function_id AND instrument_id = NEW.instrument_id
  ) THEN
    RAISE EXCEPTION 'O instrumento informado não está vinculado à função selecionada.';
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS attendees_auth_insert ON public.attendees;
DROP POLICY IF EXISTS attendees_auth_update ON public.attendees;
CREATE POLICY attendees_auth_insert ON public.attendees
FOR INSERT TO authenticated
WITH CHECK (
  private.can_access_house(auth.uid(), prayer_house_id)
  AND private.event_is_open(event_id)
);
CREATE POLICY attendees_auth_update ON public.attendees
FOR UPDATE TO authenticated
USING (private.can_access_house(auth.uid(), prayer_house_id))
WITH CHECK (
  private.can_access_house(auth.uid(), prayer_house_id)
  AND private.event_is_open(event_id)
);

CREATE OR REPLACE FUNCTION public.validate_training_attendee()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_status text;
  digits text;
BEGIN
  SELECT event_type, status INTO v_type, v_status
  FROM public.events WHERE id = NEW.event_id;
  IF v_type IS DISTINCT FROM 'treinamento' THEN
    RAISE EXCEPTION 'Participantes de treinamento só podem ser vinculados a eventos do tipo Treinamento.';
  END IF;
  IF v_status <> 'aberto' THEN
    RAISE EXCEPTION 'Este evento não está disponível para novos registros.';
  END IF;
  digits := regexp_replace(coalesce(NEW.cpf,''), '[^0-9]', '', 'g');
  IF length(digits) <> 11 THEN
    RAISE EXCEPTION 'CPF inválido.';
  END IF;
  NEW.cpf := digits;
  NEW.full_name := trim(regexp_replace(coalesce(NEW.full_name, ''), '\s+', ' ', 'g'));
  IF NEW.full_name = '' OR char_length(NEW.full_name) > 150 THEN
    RAISE EXCEPTION 'Informe um nome válido com até 150 caracteres.';
  END IF;
  IF NEW.birth_date IS NULL OR NEW.birth_date > current_date THEN
    RAISE EXCEPTION 'Data de nascimento inválida.';
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS training_attendees_auth_insert ON public.training_attendees;
DROP POLICY IF EXISTS training_attendees_auth_update ON public.training_attendees;
CREATE POLICY training_attendees_auth_insert ON public.training_attendees
FOR INSERT TO authenticated
WITH CHECK (
  private.can_access_house(auth.uid(), prayer_house_id)
  AND private.event_is_open(event_id)
);
CREATE POLICY training_attendees_auth_update ON public.training_attendees
FOR UPDATE TO authenticated
USING (private.can_access_house(auth.uid(), prayer_house_id))
WITH CHECK (
  private.can_access_house(auth.uid(), prayer_house_id)
  AND private.event_is_open(event_id)
);