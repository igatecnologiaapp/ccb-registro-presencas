import { createFileRoute } from "@tanstack/react-router";
import { Search, ShieldCheck, UserCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyBlock, ErrorBlock, LoadingBlock, Panel } from "@/components/report-blocks";
import { SearchSelect } from "@/components/search-select";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth";
import {
  useAppUsers,
  useCreateAppUser,
  useSectors,
  useSetUserAccess,
  useSetUserActive,
  useSetUserRole,
} from "@/lib/data";

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
  const setAccess = useSetUserAccess();
  const createUser = useCreateAppUser();
  const sectors = useSectors();
  const sectorOptions = (sectors.data ?? [])
    .filter((s) => s.active)
    .map((s) => ({ value: s.id, label: s.name }));
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "operator" as AppRole,
    sectorId: null as string | null,
    allPrayerHouses: false,
  });
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

  const changeAccess = async (
    userId: string,
    patch: { sector_id?: string | null; all_prayer_houses?: boolean },
  ) => {
    try {
      await setAccess.mutateAsync({ userId, ...patch });
      toast.success("Acesso às Casas de Oração atualizado.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitNewUser = async () => {
    if (!form.displayName.trim()) {
      toast.error("Informe o nome do usuário.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Informe o e-mail.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (form.role === "operator" && !form.allPrayerHouses && !form.sectorId) {
      toast.error("Selecione um Setor ou libere todas as Casas de Oração.");
      return;
    }
    try {
      await createUser.mutateAsync({
        displayName: form.displayName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        sectorId: form.sectorId,
        allPrayerHouses: form.allPrayerHouses,
      });
      toast.success("Usuário cadastrado.");
      setForm({
        displayName: "",
        email: "",
        password: "",
        role: "operator",
        sectorId: null,
        allPrayerHouses: false,
      });
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
        title="Cadastrar novo usuário"
        description="Defina o perfil, o Setor e o acesso às Casas de Oração."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="novo-nome">Nome</Label>
            <Input
              id="novo-nome"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Nome completo"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="novo-email">E-mail</Label>
            <Input
              id="novo-email"
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="usuario@exemplo.com"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nova-senha">Senha provisória</Label>
            <Input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo de 6 caracteres"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil</Label>
            <SearchSelect
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={(value) => setForm((f) => ({ ...f, role: value as AppRole }))}
              placeholder="Selecionar perfil"
            />
          </div>
          {form.role === "operator" && (
            <>
              <div className="space-y-1.5">
                <Label>Setor</Label>
                <SearchSelect
                  options={sectorOptions}
                  value={form.sectorId}
                  onChange={(value) => setForm((f) => ({ ...f, sectorId: value }))}
                  placeholder="Selecionar setor…"
                  emptyText="Nenhum setor cadastrado."
                />
              </div>
              <div className="flex items-center justify-between gap-3 sm:pt-6">
                <Label htmlFor="novo-todas">Liberar todas as Casas de Oração</Label>
                <Switch
                  id="novo-todas"
                  checked={form.allPrayerHouses}
                  onCheckedChange={(value) => setForm((f) => ({ ...f, allPrayerHouses: value }))}
                />
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              void submitNewUser();
            }}
            disabled={createUser.isPending}
          >
            {createUser.isPending ? "Cadastrando…" : "Cadastrar usuário"}
          </Button>
        </div>
      </Panel>

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
                {user.role !== "admin" && (
                  <div className="flex w-full flex-wrap items-center gap-3 pl-8">
                    <div className="w-48 shrink-0 max-sm:w-full">
                      <SearchSelect
                        options={sectorOptions}
                        value={user.sector_id}
                        onChange={(value) => {
                          void changeAccess(user.id, { sector_id: value });
                        }}
                        placeholder="Sem setor"
                        emptyText="Nenhum setor cadastrado."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        Todas as Casas de Oração
                      </span>
                      <Switch
                        checked={user.all_prayer_houses}
                        aria-label={`Todas as Casas de Oração para ${user.email}`}
                        onCheckedChange={(value) => {
                          void changeAccess(user.id, { all_prayer_houses: value });
                        }}
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
