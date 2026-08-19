import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { EmptyBlock, ErrorBlock, LoadingBlock, Panel } from "@/components/report-blocks";
import { useDeleteCatalogItem, useSaveCatalogItem, type NamedRow } from "@/lib/data";

type Props = {
  table: "functions" | "instruments" | "prayer_houses";
  title: string;
  singular: string;
  description: string;
  rows: NamedRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
};

export function CatalogPage({
  table,
  title,
  singular,
  description,
  rows,
  isLoading,
  isError,
}: Props) {
  const save = useSaveCatalogItem(table);
  const remove = useDeleteCatalogItem(table);

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<NamedRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [toDelete, setToDelete] = useState<NamedRow | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = rows ?? [];
    return term ? list.filter((r) => r.name.toLowerCase().includes(term)) : list;
  }, [rows, search]);

  const openNew = () => {
    setEditing(null);
    setName("");
    setActive(true);
    setDialogOpen(true);
  };

  const openEdit = (row: NamedRow) => {
    setEditing(row);
    setName(row.name);
    setActive(row.active);
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome.");
      return;
    }
    try {
      await save.mutateAsync(editing ? { id: editing.id, name, active } : { name, active });
      toast.success(editing ? `${singular} atualizado.` : `${singular} cadastrado.`);
      setDialogOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success(`${singular} excluído.`);
    } catch {
      toast.error(
        `Não é possível excluir: existem registros históricos vinculados. Desative o cadastro em vez de excluir.`,
      );
    }
    setToDelete(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="doc-title text-xl">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </header>

      <Panel
        title={`${filtered.length} ${filtered.length === 1 ? "registro" : "registros"}`}
        actions={
          <Button onClick={openNew} size="sm">
            <Plus className="size-4" /> Novo
          </Button>
        }
      >
        <div className="relative mb-4">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar…"
            className="h-11 pl-9"
          />
        </div>

        {isLoading ? (
          <LoadingBlock />
        ) : isError ? (
          <ErrorBlock />
        ) : filtered.length === 0 ? (
          <EmptyBlock label="Nenhum registro encontrado." />
        ) : (
          <ul className="divide-y">
            {filtered.map((row) => (
              <li key={row.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
                {row.active ? (
                  <Badge variant="secondary">Ativo</Badge>
                ) : (
                  <Badge variant="outline">Inativo</Badge>
                )}
                <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Editar">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setToDelete(row)}
                  aria-label="Excluir"
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${singular}` : `Novo ${singular}`}</DialogTitle>
            <DialogDescription>Preencha o nome e defina a situação do cadastro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="catalog-name">Nome</Label>
              <Input
                id="catalog-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
              <Label htmlFor="catalog-active" className="text-sm">
                Ativo
              </Label>
              <Switch id="catalog-active" checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Cadastros com histórico de presenças não podem ser
              excluídos — nesse caso, desative o registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
