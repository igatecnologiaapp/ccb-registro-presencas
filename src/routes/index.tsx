import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FileText, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  Panel,
  RankTable,
  StatCard,
} from "@/components/report-blocks";
import { useSelectedEvent } from "@/components/event-context";
import { useAttendees, useFunctions, useInstruments, usePrayerHouses } from "@/lib/data";
import { buildReport, formatDate, formatPercent, formatTime } from "@/lib/report";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Presenças — Reunião Técnica Musical" },
      {
        name: "description",
        content:
          "Painel com totais de presença, ranking de funções e instrumentos e situação das casas de oração da reunião técnica musical.",
      },
      { property: "og:title", content: "Painel de Presenças — Reunião Técnica Musical" },
      {
        property: "og:description",
        content:
          "Acompanhe em tempo real os totais e rankings de presença da reunião técnica musical.",
      },
    ],
  }),
  component: Dashboard,
});

const SHORTCUTS = [
  { to: "/presencas", label: "Registrar presença", icon: ClipboardList },
  { to: "/relatorio", label: "Relatório e PDF", icon: FileText },
  { to: "/vinculos", label: "Função × Instrumento", icon: Link2 },
  { to: "/funcoes", label: "Funções", icon: Users },
] as const;

function Dashboard() {
  const { selectedEvent, selectedEventId, isLoading: eventsLoading } = useSelectedEvent();
  const attendees = useAttendees(selectedEventId);
  const functions = useFunctions();
  const instruments = useInstruments();
  const houses = usePrayerHouses();

  const loading =
    eventsLoading || functions.isLoading || instruments.isLoading || houses.isLoading;
  const failed = functions.isError || instruments.isError || houses.isError || attendees.isError;

  const report = buildReport(
    attendees.data ?? [],
    functions.data ?? [],
    instruments.data ?? [],
    houses.data ?? [],
  );
  const activeHouses = (houses.data ?? []).filter((h) => h.active).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="doc-title text-xl">Painel de Presenças</h1>
        {selectedEvent ? (
          <p className="text-muted-foreground num mt-1 text-sm">
            {selectedEvent.name} · {formatDate(selectedEvent.date)} ·{" "}
            {formatTime(selectedEvent.start_time)} · {selectedEvent.location || "—"}
          </p>
        ) : (
          <p className="text-muted-foreground mt-1 text-sm">
            Cadastre um evento para iniciar os registros.
          </p>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SHORTCUTS.map(({ to, label, icon: Icon }) => (
          <Button key={to} asChild variant="outline" className="h-auto justify-start py-3">
            <Link to={to}>
              <Icon className="size-4" />
              <span className="truncate">{label}</span>
            </Link>
          </Button>
        ))}
      </div>

      {loading ? (
        <Panel title="Resumo">
          <LoadingBlock />
        </Panel>
      ) : failed ? (
        <Panel title="Resumo">
          <ErrorBlock />
        </Panel>
      ) : !selectedEvent ? (
        <Panel title="Resumo">
          <EmptyBlock label="Nenhum evento selecionado." />
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link to="/eventos">Criar evento</Link>
            </Button>
          </div>
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total de presentes" value={report.total} emphasis />
            <StatCard
              label="Com instrumento"
              value={report.withInstrument}
              hint={formatPercent(report.total ? (report.withInstrument / report.total) * 100 : 0)}
            />
            <StatCard label="Sem instrumento" value={report.withoutInstrument} />
            <StatCard
              label="Casas presentes"
              value={`${report.presentHouses.length}/${activeHouses}`}
              hint={`${report.absentHouses.length} ausentes`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Top funções" description="Cinco funções com maior número de presentes.">
              <RankTable rows={report.functionRanking} firstColumn="Função" limit={5} />
            </Panel>
            <Panel title="Top instrumentos" description="Cinco instrumentos mais frequentes.">
              <RankTable rows={report.instrumentRanking} firstColumn="Instrumento" limit={5} />
            </Panel>
          </div>

          <Panel
            title="Casas de oração com maior participação"
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link to="/relatorio">Ver relatório completo</Link>
              </Button>
            }
          >
            <RankTable rows={report.presentHouses} firstColumn="Casa de Oração" limit={10} />
          </Panel>
        </>
      )}
    </div>
  );
}
