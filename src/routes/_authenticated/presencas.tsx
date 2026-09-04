import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Trash2, UserPlus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyBlock, ErrorBlock, LoadingBlock, Panel } from "@/components/report-blocks";
import { SearchSelect } from "@/components/search-select";
import { useSelectedEvent } from "@/components/event-context";
import {
  useAttendees,
  useDeleteAttendee,
  useFunctionInstruments,
  useFunctions,
  useInstruments,
  usePrayerHouses,
  useSaveAttendee,
  type AttendeeRow,
} from "@/lib/data";
import { nameMap } from "@/lib/report";

export const Route = createFileRoute("/_authenticated/presencas")({
  head: () => ({
    meta: [
      { title: "Registro de Presença — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Registre participantes por nome, casa de oração, função e instrumento durante a reunião técnica musical.",
      },
      { property: "og:title", content: "Registro de Presença — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Lançamento rápido de presenças por casa de oração, função e instrumento.",
      },
    ],
  }),
  component: AttendanceRoute,
});

function AttendanceRoute() {
  const { selectedEvent, selectedEventId } = useSelectedEvent();
  const functions = useFunctions();
  const instruments = useInstruments();
  const houses = usePrayerHouses();
  const links = useFunctionInstruments();
  const attendees = useAttendees(selectedEventId);
  const save = useSaveAttendee();
  const remove = useDeleteAttendee();

  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [houseId, setHouseId] = useState<string | null>(null);
  const [functionId, setFunctionId] = useState<string | null>(null);
  const [instrumentId, setInstrumentId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AttendeeRow | null>(null);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<AttendeeRow | null>(null);
  const [filterHouse, setFilterHouse] = useState<string | null>(null);
  const [filterFunction, setFilterFunction] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState(false);

  const activeFunctions = (functions.data ?? []).filter((f) => f.active);
  const activeHouses = (houses.data ?? []).filter((h) => h.active);

  const allowedInstruments = useMemo(() => {
    if (!functionId) return [];
    const allowed = new Set(
      (links.data ?? []).filter((l) => l.function_id === functionId).map((l) => l.instrument_id),
    );
    return (instruments.data ?? []).filter((i) => i.active && allowed.has(i.id));
  }, [links.data, instruments.data, functionId]);

  const instrumentRequired = allowedInstruments.length > 0;

  const functionNames = nameMap(functions.data ?? []);
  const instrumentNames = nameMap(instruments.data ?? []);
  const houseNames = nameMap(houses.data ?? []);

  const rows = useMemo(() => {
    let list = attendees.data ?? [];
    if (filterHouse) list = list.filter((a) => a.prayer_house_id === filterHouse);
    if (filterFunction) list = list.filter((a) => a.function_id === filterFunction);
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        (houseNames.get(a.prayer_house_id) ?? "").toLowerCase().includes(term) ||
        (functionNames.get(a.function_id) ?? "").toLowerCase().includes(term),
    );
  }, [attendees.data, search, houseNames, functionNames, filterHouse, filterFunction]);

  const resetForm = (keepContext: boolean) => {
    setName("");
    setEditing(null);
    if (!keepContext) {
      setHouseId(null);
      setFunctionId(null);
      setInstrumentId(null);
    }
    nameRef.current?.focus();
  };

  const submit = async () => {
    if (!selectedEventId) {
      toast.error("Selecione um evento antes de registrar presenças.");
      return;
    }
    if (!name.trim() || !houseId || !functionId) {
      toast.error("Informe nome, casa de oração e função.");
      return;
    }
    if (instrumentRequired && !instrumentId) {
      toast.error("Esta função exige a escolha do instrumento.");
      return;
    }

    const duplicate = (attendees.data ?? []).find(
      (a) =>
        a.id !== editing?.id &&
        a.prayer_house_id === houseId &&
        a.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (duplicate) {
      setPendingDuplicate(true);
      return;
    }

    await persist();
  };

  const persist = async () => {
    if (!selectedEventId || !houseId || !functionId) return;
    try {
      await save.mutateAsync({
        ...(editing ? { id: editing.id } : {}),
        event_id: selectedEventId,
        name,
        prayer_house_id: houseId,
        function_id: functionId,
        instrument_id: instrumentRequired ? instrumentId : null,
      });
      toast.success(editing ? "Presença atualizada." : "Presença registrada.");
      resetForm(true);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!selectedEvent) {
    return (
      <div className="mx-auto max-w-2xl">
        <Panel title="Nenhum evento selecionado">
          <EmptyBlock label="Crie ou selecione um evento para iniciar o registro de presenças." />
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link to="/eventos">Ir para Eventos</Link>
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  if (selectedEvent.event_type === "treinamento") {
    return (
      <div className="mx-auto max-w-2xl">
        <Panel title="Evento de treinamento">
          <EmptyBlock label="O evento ativo é um Treinamento e utiliza o formulário de inscrições (nome completo, CPF, nascimento, congregação e função)." />
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link to="/treinamento">Ir para inscrições de treinamento</Link>
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="doc-title text-xl">Registro de Presença</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Evento ativo: <span className="text-foreground font-medium">{selectedEvent.name}</span>. O
          nome permanece em foco para lançamentos em sequência.
        </p>
      </header>

      <Panel
        title={editing ? "Editar participante" : "Novo participante"}
        description="Casa de oração, função e instrumento permanecem selecionados após salvar."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="attendee-name">Nome do participante</Label>
            <Input
              id="attendee-name"
              ref={nameRef}
              className="h-11"
              autoFocus
              value={name}
              placeholder="Nome completo"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendee-house">Casa de Oração</Label>
            <SearchSelect
              id="attendee-house"
              options={activeHouses.map((h) => ({ value: h.id, label: h.name }))}
              value={houseId}
              onChange={setHouseId}
              placeholder="Selecionar casa de oração…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendee-function">Função</Label>
            <SearchSelect
              id="attendee-function"
              options={activeFunctions.map((f) => ({ value: f.id, label: f.name }))}
              value={functionId}
              onChange={(value) => {
                setFunctionId(value);
                setInstrumentId(null);
              }}
              placeholder="Selecionar função…"
            />
          </div>
          {instrumentRequired && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="attendee-instrument">
                Instrumento <span className="text-destructive text-xs">(obrigatório)</span>
              </Label>
              <SearchSelect
                id="attendee-instrument"
                options={allowedInstruments.map((i) => ({ value: i.id, label: i.name }))}
                value={instrumentId}
                onChange={setInstrumentId}
                placeholder="Selecionar instrumento…"
              />
            </div>
          )}
          {functionId && !instrumentRequired && (
            <p className="text-muted-foreground sm:col-span-2 text-xs">
              Esta função não utiliza instrumento — o campo não é exibido.
            </p>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={submit} disabled={save.isPending} className="min-w-40">
            <UserPlus className="size-4" />
            {save.isPending ? "Salvando…" : editing ? "Salvar alterações" : "Registrar presença"}
          </Button>
          <Button variant="outline" onClick={() => resetForm(false)}>
            Limpar
          </Button>
        </div>
      </Panel>

      <Panel
        title={`Presenças registradas · ${rows.length} de ${(attendees.data ?? []).length}`}
        description="Toque em um registro para editá-lo."
      >
        <div className="relative mb-4">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="h-11 pl-9"
            placeholder="Pesquisar por nome, casa de oração ou função…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <SearchSelect
            options={[
              { value: "", label: "Todas as casas de oração" },
              ...activeHouses.map((h) => ({ value: h.id, label: h.name })),
            ]}
            value={filterHouse ?? ""}
            onChange={(v) => setFilterHouse(v || null)}
            placeholder="Filtrar por casa de oração"
          />
          <SearchSelect
            options={[
              { value: "", label: "Todas as funções" },
              ...activeFunctions.map((f) => ({ value: f.id, label: f.name })),
            ]}
            value={filterFunction ?? ""}
            onChange={(v) => setFilterFunction(v || null)}
            placeholder="Filtrar por função"
          />
        </div>

        {attendees.isLoading ? (
          <LoadingBlock />
        ) : attendees.isError ? (
          <ErrorBlock />
        ) : rows.length === 0 ? (
          <EmptyBlock label="Nenhuma presença registrada até o momento." />
        ) : (
          <ul className="divide-y">
            {rows.map((row, index) => (
              <li key={row.id} className="flex items-center gap-3 py-2.5">
                <span className="num text-muted-foreground w-8 shrink-0 text-right text-xs">
                  {index + 1}
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setEditing(row);
                    setName(row.name);
                    setHouseId(row.prayer_house_id);
                    setFunctionId(row.function_id);
                    setInstrumentId(row.instrument_id);
                    nameRef.current?.focus();
                  }}
                >
                  <span className="block truncate text-sm font-medium">{row.name}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {houseNames.get(row.prayer_house_id) ?? "—"} ·{" "}
                    {functionNames.get(row.function_id) ?? "—"}
                  </span>
                </button>
                {row.instrument_id && (
                  <Badge variant="secondary" className="max-sm:hidden">
                    {instrumentNames.get(row.instrument_id)}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir"
                  onClick={() => setToDelete(row)}
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <AlertDialog open={pendingDuplicate} onOpenChange={setPendingDuplicate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nome já registrado nesta casa de oração</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um registro com este nome nesta casa de oração neste evento. Deseja
              registrar novamente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setPendingDuplicate(false);
                await persist();
              }}
            >
              Registrar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro de presença será removido deste evento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await remove.mutateAsync(toDelete.id);
                  toast.success("Registro excluído.");
                } catch (error) {
                  toast.error((error as Error).message);
                }
                setToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
