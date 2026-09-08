import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Map,
  Menu,
  Music2,
  ShieldHalf,
  UserCog,
  Users,
  Church,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth, useSignOut, roleLabel } from "@/lib/auth";
import { LogOut, ShieldCheck, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSelectedEvent } from "@/components/event-context";
import { SearchSelect } from "@/components/search-select";
import { eventTypeLabel } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/report";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly: boolean;
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Início",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: true }],
  },
  {
    title: "Registros",
    items: [
      { to: "/presencas", label: "Registrar Presenças", icon: ClipboardList, adminOnly: false },
      {
        to: "/treinamento",
        label: "Inscrições de Treinamento",
        icon: GraduationCap,
        adminOnly: true,
      },
      { to: "/relatorio", label: "Relatórios", icon: FileText, adminOnly: true },
    ],
  },
  {
    title: "Eventos",
    items: [{ to: "/eventos", label: "Eventos", icon: CalendarDays, adminOnly: true }],
  },
  {
    title: "Cadastros",
    items: [
      { to: "/casas", label: "Casas de Oração", icon: Church, adminOnly: true },
      { to: "/setores", label: "Setores", icon: Map, adminOnly: true },
      { to: "/funcoes", label: "Funções", icon: Users, adminOnly: true },
      { to: "/instrumentos", label: "Instrumentos", icon: Music2, adminOnly: true },
      { to: "/vinculos", label: "Funções × Instrumentos", icon: Link2, adminOnly: true },
    ],
  },
  {
    title: "Administração",
    items: [
      { to: "/usuarios", label: "Usuários e Perfis", icon: UserCog, adminOnly: true },
    ],
  },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="text-sidebar-foreground/45 px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
            {group.title}
          </p>
          <div className="flex flex-col gap-1">
            {group.items.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}


function EventPicker() {
  const { events, selectedEventId, selectEvent } = useSelectedEvent();
  return (
    <SearchSelect
      options={events.map((e) => ({
        value: e.id,
        label: `${e.name} — ${formatDate(e.date)}`,
      }))}
      value={selectedEventId}
      onChange={selectEvent}
      placeholder="Selecionar evento…"
      emptyText="Nenhum evento cadastrado."
    />
  );
}

function Brand() {
  return (
    <div className="border-sidebar-border border-b px-5 py-5">
      <p className="doc-title text-sidebar-foreground text-lg leading-tight font-semibold tracking-wide">
        Congregação Cristã no Brasil
      </p>
      <p className="text-sidebar-foreground/60 mt-1.5 text-[11px] leading-snug tracking-[0.1em] uppercase">
        Registros de Presenças
        <br />
        Reuniões e Treinamentos
      </p>
    </div>
  );
}

function UserBox() {
  const { displayName, role, session } = useAuth();
  const signOut = useSignOut();
  const label = displayName || session?.user.email || "Usuário";
  return (
    <div className="border-sidebar-border mt-auto border-t px-4 py-4">
      <div className="flex items-start gap-2">
        <UserCircle2 className="text-sidebar-foreground/70 mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sidebar-foreground truncate text-sm font-medium">{label}</p>
          <p className="text-sidebar-foreground/60 flex items-center gap-1 text-xs">
            <ShieldCheck className="size-3" />
            {role === "admin" ? "Administrador" : role === "operator" ? "Operador" : "Sem perfil"}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        onClick={() => {
          void signOut();
        }}
      >
        <LogOut className="mr-2 size-4" />
        Sair
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { selectedEvent } = useSelectedEvent();

  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar hidden w-72 shrink-0 flex-col lg:flex">
        <Brand />
        <div className="p-3">
          <NavList />
        </div>
        <UserBox />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-30 border-b backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-sidebar flex w-72 flex-col p-0">
                <Brand />
                <div className="p-3">
                  <NavList onNavigate={() => setOpen(false)} />
                </div>
                <UserBox />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                Evento selecionado
              </p>
              <p className="truncate text-sm font-medium">
                {selectedEvent
                  ? `${selectedEvent.name} · ${eventTypeLabel(selectedEvent.event_type)} · ${formatDate(
                      selectedEvent.date,
                    )} · ${formatTime(selectedEvent.start_time)} · ${selectedEvent.location || "—"}`
                  : "Nenhum evento selecionado"}
              </p>
            </div>

            <div className="w-full max-w-72 shrink-0 max-sm:hidden">
              <EventPicker />
            </div>
          </div>
          <div className="border-t px-4 py-2 sm:hidden">
            <EventPicker />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
