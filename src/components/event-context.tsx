import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useEvents, type EventRow } from "@/lib/data";

const STORAGE_KEY = "rtm.selectedEventId";

/** Estado válido "Sem evento": nenhum evento selecionado, sem seleção automática. */
export const NO_EVENT = "__none__";

type EventContextValue = {
  events: EventRow[];
  selectedEvent: EventRow | null;
  selectedEventId: string | null;
  /** Aceita o id de um evento ou NO_EVENT para o estado "Sem evento". */
  selectEvent: (id: string) => void;
  /** true quando o usuário escolheu explicitamente "Sem evento". */
  noEventSelected: boolean;
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
    if (selectedId === NO_EVENT) return;
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
      selectedEventId: selectedId === NO_EVENT ? null : selectedId,
      selectedEvent:
        selectedId === NO_EVENT ? null : (list.find((e) => e.id === selectedId) ?? null),
      noEventSelected: selectedId === NO_EVENT,
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
