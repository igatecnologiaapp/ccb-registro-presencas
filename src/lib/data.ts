import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EventRow = {
  id: string;
  name: string;
  date: string;
  start_time: string;
  location: string;
  status: string;
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

export type PrayerHouseRow = NamedRow & { code: string | null };

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
      unwrap<NamedRow[]>(await supabase.from("instruments").select("*").order("name")),
  });
}

export function usePrayerHouses() {
  return useQuery({
    queryKey: ["prayer_houses"],
    queryFn: async () =>
      unwrap<PrayerHouseRow[]>(await supabase.from("prayer_houses").select("*").order("name")),
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

/* ---------------- mutations ---------------- */

function useInvalidate(keys: string[]) {
  const qc = useQueryClient();
  return () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useSaveEvent() {
  const invalidate = useInvalidate(["events"]);
  return useMutation({
    mutationFn: async (input: Partial<EventRow> & { id?: string }) => {
      const payload = {
        name: input.name,
        date: input.date,
        start_time: input.start_time,
        location: input.location,
        status: input.status,
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
  const invalidate = useInvalidate(["events", "attendees"]);
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
            status: "aberto",
          })
          .select()
          .single(),
      ),
    onSuccess: invalidate,
  });
}

type CatalogTable = "functions" | "instruments" | "prayer_houses";

export function useSaveCatalogItem(table: CatalogTable) {
  const invalidate = useInvalidate([table]);
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; active: boolean }) => {
      const payload = { name: input.name.trim(), active: input.active };
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
  const invalidate = useInvalidate([table]);
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
