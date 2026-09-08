import { createFileRoute } from "@tanstack/react-router";
import { Search, ShieldCheck, UserCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyBlock, ErrorBlock, LoadingBlock, Panel } from "@/components/report-blocks";
import { SearchSelect } from "@/components/search-select";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth";
import { useAppUsers, useSetUserActive, useSetUserRole } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e Perfis — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Área administrativa para definir o perfil de acesso de cada usuário e liberar ou bloquear o acesso ao sistema.",
      },
      { property: "og:title", content: "Usuários e Perfis — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Defina perfis de acesso e libere ou bloqueie usuários do sistema.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersRoute,
});

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as AppRole[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

function UsersRoute() {
  const { data, isLoading, isError } = useAppUsers();
  const setRole = useSetUserRole();
  const setActive = useSetUserActive();
  const { session } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = data ?? [];
    if (!term) return list;
    return list.filter(
      (u) =>
        u.email.toLowerCase().includes(term) || (u.display_name ?? "").toLowerCase().includes(term),
    );
  }, [data, search]);

  const adminCount = (data ?? []).filter((u) => u.role === "admin" && u.active).length;

  const changeRole = async (userId: string, role: AppRole, current: AppRole | null) => {
    if (role === current) return;
    if (current === "admin" && adminCount <= 1) {
      toast.error("O sistema precisa de pelo menos um Administrador ativo.");
      return;
    }
    try {
      await setRole.mutateAsync({ userId, role });
      toast.success(`Perfil alterado para ${ROLE_LABELS[role]}.`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const changeActive = async (userId: string, active: boolean, role: AppRole | null) => {
    if (!active && userId === session?.user.id) {
      toast.error("Você não pode bloquear o seu próprio acesso.");
      return;
    }
    if (!active && role === "admin" && adminCount <= 1) {
      toast.error("O sistema precisa de pelo menos um Administrador ativo.");
      return;
    }
    try {
      await setActive.mutateAsync({ userId, active });
      toast.success(active ? "Acesso liberado." : "Acesso bloqueado.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="doc-title text-xl">Usuários e Perfis de Acesso</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          O perfil <strong>Administrador</strong> tem acesso completo ao sistema. O perfil{" "}
          <strong>Colaborador</strong> acessa somente o registro de presenças. Usuários bloqueados
          não conseguem registrar nem alterar nada, mesmo fora da tela.
        </p>
      </header>

      <Panel
        title={`${filtered.length} ${filtered.length === 1 ? "usuário" : "usuários"}`}
        description="Novos usuários entram como Colaborador ao acessar o sistema pela primeira vez."
      >
        <div className="relative mb-4">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou e-mail…"
            className="h-11 pl-9"
          />
        </div>

        {isLoading ? (
          <LoadingBlock />
        ) : isError ? (
          <ErrorBlock />
        ) : filtered.length === 0 ? (
          <EmptyBlock label="Nenhum usuário encontrado." />
        ) : (
          <ul className="divide-y">
            {filtered.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
                <UserCircle2 className="text-muted-foreground size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.display_name || user.email || "Usuário"}
                    {user.id === session?.user.id && (
                      <span className="text-muted-foreground font-normal"> (você)</span>
                    )}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{user.email || "—"}</p>
                </div>
                <div className="w-48 shrink-0 max-sm:w-full">
                  <SearchSelect
                    options={ROLE_OPTIONS}
                    value={user.role}
                    onChange={(value) => {
                      void changeRole(user.id, value as AppRole, user.role);
                    }}
                    placeholder="Sem perfil"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {user.active ? (
                    <Badge variant="secondary">
                      <ShieldCheck className="mr-1 size-3" /> Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline">Bloqueado</Badge>
                  )}
                  <Switch
                    checked={user.active}
                    aria-label={`Acesso de ${user.email}`}
                    onCheckedChange={(value) => {
                      void changeActive(user.id, value, user.role);
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
