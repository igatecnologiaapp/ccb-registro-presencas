import { createFileRoute } from "@tanstack/react-router";
import { Copy, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyBlock, ErrorBlock, LoadingBlock, Panel } from "@/components/report-blocks";
import { useSelectedEvent } from "@/components/event-context";
import {
  EVENT_TYPES,
  eventTypeLabel,
  useDeleteEvent,
  useDuplicateEvent,
  useSaveEvent,
  type EventRow,
} from "@/lib/data";
import { formatDate, formatTime } from "@/lib/report";

export const Route = createFileRoute("/_authenticated/_admin/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos e Reuniões — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Cadastre reuniões técnicas musicais com data, horário e local, e escolha o evento ativo para o registro de presenças.",
      },
      { property: "og:title", content: "Eventos e Reuniões — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Gerencie as reuniões técnicas musicais e o evento ativo do sistema.",
      },
    ],
  }),
  component: EventsRoute,
});

const emptyForm = {
  name: "",
  date: "",
  start_time: "",
  location: "",
  status: "aberto",
  event_type: "reuniao_musical",
};

function EventsRoute() {
  const { events, selectedEventId, selectEvent, isLoading, isError } = useSelectedEvent();
  const save = useSaveEvent();
  const duplicate = useDuplicateEvent();
  const remove = useDeleteEvent();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<EventRow | null>(null);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (event: EventRow) => {
    setEditingId(event.id);
    setForm({
      name: event.name,
      date: event.date,
      start_time: formatTime(event.start_time),
      location: event.location ?? "",
      status: event.status,
      event_type: event.event_type,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.date || !form.start_time) {
      toast.error("Informe nome, data e horário.");
      return;
    }
    try {
      const saved = await save.mutateAsync({
        ...(editingId ? { id: editingId } : {}),
        name: form.name.trim(),
        date: form.date,
        start_time: form.start_time,
        location: form.location.trim(),
        status: form.status,
        event_type: form.event_type,
      });
      toast.success(editingId ? "Evento atualizado." : "Evento criado.");
      if (!editingId && saved && typeof saved === "object" && "id" in saved) {
        selectEvent((saved as EventRow).id);
      }
      setOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="doc-title text-xl">Eventos e Reuniões</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Cada reunião possui seu próprio registro de presenças e relatório independente.
        </p>
      </header>

      <Panel
        title={`${events.length} ${events.length === 1 ? "evento" : "eventos"}`}
        description="Toque em um evento para torná-lo o evento ativo."
        actions={
          <Button size="sm" onClick={openNew}>
            <Plus className="size-4" /> Novo evento
          </Button>
        }
      >
        {isLoading ? (
          <LoadingBlock />
        ) : isError ? (
          <ErrorBlock />
        ) : events.length === 0 ? (
          <EmptyBlock label="Nenhum evento cadastrado. Crie o primeiro evento para começar." />
        ) : (
          <ul className="space-y-2">
            {events.map((event) => {
              const active = event.id === selectedEventId;
              return (
                <li
                  key={event.id}
                  className={
                    active
                      ? "border-primary bg-primary/5 rounded-md border p-3"
                      : "hover:bg-muted/50 rounded-md border p-3 transition-colors"
                  }
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <button
                      type="button"
                      onClick={() => selectEvent(event.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{event.name}</span>
                        {active && <Badge>Ativo</Badge>}
                        <Badge variant="outline">{eventTypeLabel(event.event_type)}</Badge>
                        <Badge variant={event.status === "aberto" ? "secondary" : "outline"}>
                          {event.status === "aberto" ? "Aberto" : "Encerrado"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground num mt-1 flex flex-wrap items-center gap-x-3 text-xs">
                        <span>
                          {formatDate(event.date)} · {formatTime(event.start_time)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" /> {event.location}
                          </span>
                        )}
                      </p>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Duplicar"
                        onClick={async () => {
                          try {
                            await duplicate.mutateAsync(event);
                            toast.success("Evento duplicado.");
                          } catch (error) {
                            toast.error((error as Error).message);
                          }
                        }}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar"
                        onClick={() => openEdit(event)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir"
                        onClick={() => setToDelete(event)}
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar evento" : "Novo evento"}</DialogTitle>
            <DialogDescription>
              Os dados abaixo compõem o cabeçalho do relatório em PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Nome / Descrição</Label>
              <Input
                id="event-name"
                className="h-11"
                placeholder="Registros de Presenças CCB"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-type">Tipo de evento</Label>
              <Select
                value={form.event_type}
                onValueChange={(event_type) => setForm({ ...form, event_type })}
              >
                <SelectTrigger id="event-type" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Treinamento usa o formulário de inscrições (nome, CPF, nascimento). Os demais tipos
                usam o registro de presenças por função e instrumento.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-date">Data</Label>
                <Input
                  id="event-date"
                  type="date"
                  className="h-11"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">Horário</Label>
                <Input
                  id="event-time"
                  type="time"
                  className="h-11"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Local</Label>
              <Input
                id="event-location"
                className="h-11"
                placeholder="Parque Guarani"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-status">Situação</Label>
              <Select
                value={form.status}
                onValueChange={(status) => setForm({ ...form, status })}
              >
                <SelectTrigger id="event-status" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as presenças registradas neste evento serão excluídas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await remove.mutateAsync(toDelete.id);
                  toast.success("Evento excluído.");
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
