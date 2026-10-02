alter table public.events drop constraint if exists events_event_type_check;

alter table public.events
  add constraint events_event_type_check
  check (event_type in (
    'treinamento',
    'reuniao_musical',
    'reuniao_ministerial',
    'reuniao_colaboradores',
    'ensaio_musical',
    'gem'
  ));