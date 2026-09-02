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
  useDeleteTrainingAttendee,
  useFunctions,
  usePrayerHouses,
  useSaveTrainingAttendee,
  useTrainingAttendees,
  type TrainingAttendeeRow,
} from "@/lib/data";
import { ageFrom, formatCpf, formatDate, isValidCpf, nameMap } from "@/lib/report";

export const Route = createFileRoute("/_authenticated/treinamento")({
  head: () => ({
    meta: [
      { title: "Inscrições de Treinamento — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Cadastro de participantes de treinamentos com nome completo, CPF, data de nascimento, congregação e função.",
      },
      { property: "og:title", content: "Inscrições de Treinamento" },
      {
        property: "og:description",
        content: "Registre os inscritos do treinamento por congregação e função.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrainingRoute,
});

const emptyForm = { full_name: "", cpf: "", birth_date: "", houseId: "", functionId: "" };

function TrainingRoute() {
  const { selectedEvent, selectedEventId } = useSelectedEvent();
  const functions = useFunctions();
  const houses = usePrayerHouses();
  const rowsQuery = useTrainingAttendees(selectedEventId);
  const save = useSaveTrainingAttendee();
  const remove = useDeleteTrainingAttendee();

  const nameRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<TrainingAttendeeRow | null>(null);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<TrainingAttendeeRow | null>(null);

  const activeFunctions = (functions.data ?? []).filter((f) => f.active);
  const activeHouses = (houses.data ?? []).filter((h) => h.active);
  const functionNames = nameMap(functions.data ?? []);
  const houseNames = nameMap(houses.data ?? []);

  const rows = useMemo(() => {
    const list = rowsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (r) =>
        r.full_name.toLowerCase().includes(term) ||
        r.cpf.includes(term.replace(/\D/g, "")) ||
        (houseNames.get(r.prayer_house_id) ?? "").toLowerCase().includes(term) ||
        (functionNames.get(r.function_id) ?? "").toLowerCase().includes(term),
    );
  }, [rowsQuery.data, search, houseNames, functionNames]);

  const reset = (keepContext: boolean) => {
    setEditing(null);
    setForm((prev) =>
      keepContext
        ? { ...emptyForm, houseId: prev.houseId, functionId: prev.functionId }
        : { ...emptyForm },
    );
    nameRef.current?.focus();
  };

  const submit = async () => {
    if (!selectedEventId) return;
    if (!form.full_name.trim() || !form.houseId || !form.functionId || !form.birth_date) {
      toast.error("Informe nome completo, CPF, data de nascimento, congregação e função.");
      return;
    }
    if (!isValidCpf(form.cpf)) {
      toast.error("CPF inválido.");
      return;
    }
    const digits = form.cpf.replace(/\D/g, "");
    const duplicate = (rowsQuery.data ?? []).find((r) => r.id !== editing?.id && r.cpf === digits);
    if (duplicate) {
      toast.error("Este CPF já está inscrito neste treinamento.");
      return;
    }

    try {
      await save.mutateAsync({
        ...(editing ? { id: editing.id } : {}),
        event_id: selectedEventId,
        full_name: form.full_name,
        cpf: form.cpf,
        birth_date: form.birth_date,
        prayer_house_id: form.houseId,
        function_id: form.functionId,
      });
      toast.success(editing ? "Inscrição atualizada." : "Inscrição registrada.");
      reset(true);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!selectedEvent) {
    return (
      <div className="mx-auto max-w-2xl">
        <Panel title="Nenhum evento selecionado">
          <EmptyBlock label="Selecione um evento de treinamento para lançar as inscrições." />
        </Panel>
      </div>
    );
  }

  if (selectedEvent.event_type !== "treinamento") {
    return (
      <div className="mx-auto max-w-2xl">
        <Panel title="Evento não é um treinamento">
          <EmptyBlock label="O evento ativo não é do tipo Treinamento. Selecione um evento de treinamento na barra superior." />
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link to="/presencas">Ir para presenças</Link>
            </Button>
            <Button asChild>
              <Link to="/eventos">Eventos</Link>
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="doc-title text-xl">Inscrições de Treinamento</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Evento ativo: <span className="text-foreground font-medium">{selectedEvent.name}</span> ·{" "}
          {formatDate(selectedEvent.date)}
        </p>
      </header>

      <Panel
        title={editing ? "Editar inscrição" : "Nova inscrição"}
        description="Congregação e função permanecem selecionadas após salvar, para lançamentos em sequência."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="t-name">Nome completo</Label>
            <Input
              id="t-name"
              ref={nameRef}
              className="h-11"
              autoFocus
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-cpf">CPF</Label>
            <Input
              id="t-cpf"
              className="h-11"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={formatCpf(form.cpf)}
              onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "") })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-birth">Data de nascimento</Label>
            <Input
              id="t-birth"
              type="date"
              className="h-11"
              value={form.birth_date}
              onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-house">Congregação / Localidade</Label>
            <SearchSelect
              id="t-house"
              options={activeHouses.map((h) => ({ value: h.id, label: h.name }))}
              value={form.houseId || null}
              onChange={(houseId) => setForm({ ...form, houseId })}
              placeholder="Selecionar congregação…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-function">Função</Label>
            <SearchSelect
              id="t-function"
              options={activeFunctions.map((f) => ({ value: f.id, label: f.name }))}
              value={form.functionId || null}
              onChange={(functionId) => setForm({ ...form, functionId })}
              placeholder="Selecionar função…"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={submit} disabled={save.isPending} className="min-w-40">
            <UserPlus className="size-4" />
            {save.isPending ? "Salvando…" : editing ? "Salvar alterações" : "Registrar inscrição"}
          </Button>
          <Button variant="outline" onClick={() => reset(false)}>
            Limpar
          </Button>
        </div>
      </Panel>

      <Panel
        title={`Inscritos · ${(rowsQuery.data ?? []).length}`}
        description="Toque em um registro para editá-lo."
      >
        <div className="relative mb-4">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="h-11 pl-9"
            placeholder="Pesquisar por nome, CPF, congregação ou função…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {rowsQuery.isLoading ? (
          <LoadingBlock />
        ) : rowsQuery.isError ? (
          <ErrorBlock />
        ) : rows.length === 0 ? (
          <EmptyBlock label="Nenhum inscrito registrado até o momento." />
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
                    setForm({
                      full_name: row.full_name,
                      cpf: row.cpf,
                      birth_date: row.birth_date,
                      houseId: row.prayer_house_id,
                      functionId: row.function_id,
                    });
                    nameRef.current?.focus();
                  }}
                >
                  <span className="block truncate text-sm font-medium">{row.full_name}</span>
                  <span className="text-muted-foreground num block truncate text-xs">
                    {formatCpf(row.cpf)} · {formatDate(row.birth_date)} ({ageFrom(row.birth_date)}{" "}
                    anos) · {houseNames.get(row.prayer_house_id) ?? "—"}
                  </span>
                </button>
                <Badge variant="secondary" className="max-sm:hidden">
                  {functionNames.get(row.function_id) ?? "—"}
                </Badge>
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

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {toDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              A inscrição será removida deste treinamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await remove.mutateAsync(toDelete.id);
                  toast.success("Inscrição excluída.");
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
