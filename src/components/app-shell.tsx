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
  UserCog,
  Users,
  Church,
} from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth, useSignOut, roleLabel } from "@/lib/auth";
import { LogOut, ShieldCheck, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NO_EVENT, useSelectedEvent } from "@/components/event-context";
import { SearchSelect } from "@/components/search-select";
import { eventTypeLabel } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/report";
import { cn } from "@/lib/utils";
import logoCcb from "@/assets/logo-ccb.png.asset.json";

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

const GROUP_ICONS: Record<string, typeof LayoutDashboard> = {
  Registros: ClipboardList,
  Eventos: CalendarDays,
  Cadastros: Church,
  Administração: UserCog,
};

function NavLink({
  to,
  label,
  icon: Icon,
  active,
  onNavigate,
  nested,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
        nested && "ml-3",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((group) => group.items.length > 0);

  const activeGroup =
    groups.find((group) => group.items.some((item) => item.to === pathname))?.title ?? null;
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);

  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup);
  }, [activeGroup]);

  return (
    <nav className="flex flex-col gap-1">
      {groups.map((group) => {
        // "Início" é acesso direto ao Dashboard — sem submenu.
        if (group.title === "Início") {
          return group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={pathname === item.to}
              onNavigate={onNavigate}
            />
          ));
        }

        const expanded = openGroup === group.title;
        const GroupIcon = GROUP_ICONS[group.title] ?? LayoutDashboard;
        return (
          <div key={group.title}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpenGroup(expanded ? null : group.title)}
              className="text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
            >
              <GroupIcon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">{group.title}</span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  expanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {expanded && (
              <div className="mt-1 flex flex-col gap-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    icon={item.icon}
                    active={pathname === item.to}
                    onNavigate={onNavigate}
                    nested
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}



function EventPicker() {
  const { events, selectedEventId, selectEvent, noEventSelected } = useSelectedEvent();
  return (
    <SearchSelect
      options={[
        { value: NO_EVENT, label: "Sem evento" },
        ...events.map((e) => ({
          value: e.id,
          label: `${e.name} — ${formatDate(e.date)}`,
        })),
      ]}
      value={noEventSelected ? NO_EVENT : selectedEventId}
      onChange={selectEvent}
      placeholder="Selecionar evento…"
      emptyText="Nenhum evento cadastrado."
    />
  );
}

function Brand() {
  return (
    <div className="border-sidebar-border border-b px-5 py-5">
      <img
        src={logoCcb.url}
        alt="Logotipo oficial da Congregação Cristã no Brasil"
        width={568}
        height={288}
        className="mb-3 h-auto w-40 max-w-full rounded-sm bg-white p-1.5"
      />
      <p className="doc-title text-sidebar-foreground text-lg leading-tight font-semibold tracking-wide">
        Congregação Cristã no Brasil
      </p>
      <p className="text-sidebar-foreground/60 mt-1.5 text-[11px] leading-snug tracking-[0.1em] uppercase">
        Registros de Presenças
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
            {roleLabel(role)}
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
