import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const EVENT_TYPES = [
  { value: "treinamento", label: "Treinamento" },
  { value: "reuniao_musical", label: "Reunião Musical" },
  { value: "reuniao_ministerial", label: "Reunião Ministerial" },
  { value: "reuniao_colaboradores", label: "Reunião de Colaboradores" },
] as const;

export type EventType = (typeof EVENT_TYPES)[number]["value"];

export function eventTypeLabel(value: string): string {
  return EVENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export type EventRow = {
  id: string;
  name: string;
  date: string;
  start_time: string;
  location: string;
  status: string;
  event_type: string;
  created_at: string;
  updated_at: string;
};

export type NamedRow = {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type InstrumentRow = NamedRow & { is_shared: boolean };

export type PrayerHouseRow = NamedRow & { code: string | null; sector_id: string | null };

export type SectorRow = NamedRow & { code: string | null; display_order: number };

export type FunctionInstrumentRow = {
  id: string;
  function_id: string;
  instrument_id: string;
};

export type AttendeeRow = {
  id: string;
  event_id: string;
  name: string;
  prayer_house_id: string;
  function_id: string;
  instrument_id: string | null;
  created_at: string;
};

export type TrainingAttendeeRow = {
  id: string;
  event_id: string;
  prayer_house_id: string;
  full_name: string;
  cpf: string;
  birth_date: string;
  function_id: string;
  created_at: string;
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/* ---------------- queries ---------------- */

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () =>
      unwrap<EventRow[]>(
        await supabase.from("events").select("*").order("date", { ascending: false }),
      ),
  });
}

export function useFunctions() {
  return useQuery({
    queryKey: ["functions"],
    queryFn: async () =>
      unwrap<NamedRow[]>(await supabase.from("functions").select("*").order("name")),
  });
}

export function useInstruments() {
  return useQuery({
    queryKey: ["instruments"],
    queryFn: async () =>
      unwrap<InstrumentRow[]>(await supabase.from("instruments").select("*").order("name")),
  });
}

export function usePrayerHouses() {
  return useQuery({
    queryKey: ["prayer_houses"],
    queryFn: async () =>
      unwrap<PrayerHouseRow[]>(await supabase.from("prayer_houses").select("*").order("name")),
  });
}

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: async () =>
      unwrap<SectorRow[]>(
        await supabase.from("sectors").select("*").order("display_order").order("name"),
      ),
  });
}

export function useFunctionInstruments() {
  return useQuery({
    queryKey: ["function_instruments"],
    queryFn: async () =>
      unwrap<FunctionInstrumentRow[]>(
        await supabase.from("function_instruments").select("id, function_id, instrument_id"),
      ),
  });
}

export function useAttendees(eventId: string | null) {
  return useQuery({
    queryKey: ["attendees", eventId],
    enabled: !!eventId,
    queryFn: async () =>
      unwrap<AttendeeRow[]>(
        await supabase
          .from("attendees")
          .select("id, event_id, name, prayer_house_id, function_id, instrument_id, created_at")
          .eq("event_id", eventId!)
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useTrainingAttendees(eventId: string | null) {
  return useQuery({
    queryKey: ["training_attendees", eventId],
    enabled: !!eventId,
    queryFn: async () =>
      unwrap<TrainingAttendeeRow[]>(
        await supabase
          .from("training_attendees")
          .select("id, event_id, prayer_house_id, full_name, cpf, birth_date, function_id, created_at")
          .eq("event_id", eventId!)
          .order("created_at", { ascending: false }),
      ),
  });
}

/* ---------------- mutations ---------------- */

function useInvalidate(keys: string[]) {
  const qc = useQueryClient();
  return () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useSaveEvent() {
  const invalidate = useInvalidate(["events"]);
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      date: string;
      start_time: string;
      location: string;
      status: string;
      event_type: string;
    }) => {
      const payload = {
        name: input.name.trim(),
        date: input.date,
        start_time: input.start_time,
        location: input.location,
        status: input.status,
        event_type: input.event_type,
      };

      if (input.id) {
        return unwrap(
          await supabase.from("events").update(payload).eq("id", input.id).select().single(),
        );
      }
      return unwrap(await supabase.from("events").insert(payload).select().single());
    },
    onSuccess: invalidate,
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidate(["events", "attendees", "training_attendees"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useDuplicateEvent() {
  const invalidate = useInvalidate(["events"]);
  return useMutation({
    mutationFn: async (event: EventRow) =>
      unwrap(
        await supabase
          .from("events")
          .insert({
            name: `${event.name} (cópia)`,
            date: event.date,
            start_time: event.start_time,
            location: event.location,
            event_type: event.event_type,
            status: "aberto",
          })
          .select()
          .single(),
      ),
    onSuccess: invalidate,
  });
}

type CatalogTable = "functions" | "instruments" | "prayer_houses" | "sectors";

export function useSaveCatalogItem(table: CatalogTable) {
  const invalidate = useInvalidate([table]);
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      active: boolean;
      extra?: Record<string, unknown>;
    }) => {
      const payload = { name: input.name.trim(), active: input.active, ...(input.extra ?? {}) };
      if (input.id) {
        return unwrap(
          await supabase.from(table).update(payload).eq("id", input.id).select().single(),
        );
      }
      return unwrap(await supabase.from(table).insert(payload).select().single());
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCatalogItem(table: CatalogTable) {
  const invalidate = useInvalidate([table, "prayer_houses"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useToggleFunctionInstrument() {
  const invalidate = useInvalidate(["function_instruments"]);
  return useMutation({
    mutationFn: async (input: {
      functionId: string;
      instrumentId: string;
      linkId: string | null;
    }) => {
      if (input.linkId) {
        const { error } = await supabase
          .from("function_instruments")
          .delete()
          .eq("id", input.linkId);
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await supabase
        .from("function_instruments")
        .insert({ function_id: input.functionId, instrument_id: input.instrumentId });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useSetAllFunctionInstruments() {
  const invalidate = useInvalidate(["function_instruments"]);
  return useMutation({
    mutationFn: async (input: { functionId: string; instrumentIds: string[]; select: boolean }) => {
      if (!input.select) {
        const { error } = await supabase
          .from("function_instruments")
          .delete()
          .eq("function_id", input.functionId);
        if (error) throw new Error(error.message);
        return;
      }
      if (input.instrumentIds.length === 0) return;
      const { error } = await supabase.from("function_instruments").insert(
        input.instrumentIds.map((instrument_id) => ({
          function_id: input.functionId,
          instrument_id,
        })),
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useSaveAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      event_id: string;
      name: string;
      prayer_house_id: string;
      function_id: string;
      instrument_id: string | null;
    }) => {
      const payload = {
        event_id: input.event_id,
        name: input.name.trim(),
        prayer_house_id: input.prayer_house_id,
        function_id: input.function_id,
        instrument_id: input.instrument_id,
      };
      if (input.id) {
        return unwrap(
          await supabase.from("attendees").update(payload).eq("id", input.id).select().single(),
        );
      }
      return unwrap(await supabase.from("attendees").insert(payload).select().single());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendees"] }),
  });
}

export function useDeleteAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("attendees").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendees"] }),
  });
}

export function useSaveTrainingAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      event_id: string;
      prayer_house_id: string;
      full_name: string;
      cpf: string;
      birth_date: string;
      function_id: string;
    }) => {
      const payload = {
        event_id: input.event_id,
        prayer_house_id: input.prayer_house_id,
        full_name: input.full_name.trim(),
        cpf: input.cpf.replace(/\D/g, ""),
        birth_date: input.birth_date,
        function_id: input.function_id,
      };
      if (input.id) {
        return unwrap(
          await supabase
            .from("training_attendees")
            .update(payload)
            .eq("id", input.id)
            .select()
            .single(),
        );
      }
      return unwrap(await supabase.from("training_attendees").insert(payload).select().single());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_attendees"] }),
  });
}

export function useDeleteTrainingAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_attendees").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_attendees"] }),
  });
}
