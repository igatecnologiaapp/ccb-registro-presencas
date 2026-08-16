import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useEvents, type EventRow } from "@/lib/data";

const STORAGE_KEY = "rtm.selectedEventId";

type EventContextValue = {
  events: EventRow[];
  selectedEvent: EventRow | null;
  selectedEventId: string | null;
  selectEvent: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
};

const EventContext = createContext<EventContextValue | null>(null);

export function SelectedEventProvider({ children }: { children: ReactNode }) {
  const { data: events, isLoading, isError } = useEvents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelectedId(window.localStorage.getItem(STORAGE_KEY));
    setHydrated(true);
  }, []);

  const list = events ?? [];

  useEffect(() => {
    if (!hydrated || list.length === 0) return;
    const valid = selectedId && list.some((e) => e.id === selectedId);
    if (!valid) {
      const first = list[0]!;
      setSelectedId(first.id);
      window.localStorage.setItem(STORAGE_KEY, first.id);
    }
  }, [hydrated, list, selectedId]);

  const value = useMemo<EventContextValue>(
    () => ({
      events: list,
      selectedEventId: selectedId,
      selectedEvent: list.find((e) => e.id === selectedId) ?? null,
      selectEvent: (id: string) => {
        setSelectedId(id);
        window.localStorage.setItem(STORAGE_KEY, id);
      },
      isLoading,
      isError,
    }),
    [list, selectedId, isLoading, isError],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useSelectedEvent(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useSelectedEvent must be used inside SelectedEventProvider");
  return ctx;
}
