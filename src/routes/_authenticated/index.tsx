import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FileText, GraduationCap, Link2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyBlock,
  ErrorBlock,
  InstrumentTable,
  LoadingBlock,
  Panel,
  RankTable,
  StatCard,
} from "@/components/report-blocks";
import { useSelectedEvent } from "@/components/event-context";
import {
  eventTypeLabel,
  useAttendees,
  useFunctions,
  useInstruments,
  usePrayerHouses,
  useSectors,
  useTrainingAttendees,
} from "@/lib/data";
import {
  buildReport,
  buildTrainingReport,
  formatDate,
  formatPercent,
  formatTime,
} from "@/lib/report";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Painel de Presenças — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Painel com totais de presença, rankings de funções e instrumentos, resumo por setor e situação das casas de oração do evento ativo.",
      },
      { property: "og:title", content: "Painel de Presenças — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Acompanhe em tempo real os totais e rankings de presença do evento ativo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const SHORTCUTS = [
  { to: "/presencas", label: "Registrar presença", icon: ClipboardList },
  { to: "/treinamento", label: "Inscrições de treinamento", icon: GraduationCap },
  { to: "/relatorio", label: "Relatório e PDF", icon: FileText },
  { to: "/vinculos", label: "Função × Instrumento", icon: Link2 },
  { to: "/setores", label: "Setores", icon: Map },
] as const;

function Dashboard() {
  const { selectedEvent, selectedEventId, isLoading: eventsLoading } = useSelectedEvent();
  const isTraining = selectedEvent?.event_type === "treinamento";

  const attendees = useAttendees(isTraining ? null : selectedEventId);
  const trainees = useTrainingAttendees(isTraining ? selectedEventId : null);
  const functions = useFunctions();
  const instruments = useInstruments();
  const houses = usePrayerHouses();
  const sectors = useSectors();

  const loading =
    eventsLoading ||
    functions.isLoading ||
    instruments.isLoading ||
    houses.isLoading ||
    sectors.isLoading;
  const failed =
    functions.isError ||
    instruments.isError ||
    houses.isError ||
    sectors.isError ||
    attendees.isError ||
    trainees.isError;

  const report = buildReport(
    attendees.data ?? [],
    functions.data ?? [],
    instruments.data ?? [],
    houses.data ?? [],
    sectors.data ?? [],
  );
  const training = buildTrainingReport(
    trainees.data ?? [],
    functions.data ?? [],
    houses.data ?? [],
    sectors.data ?? [],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="doc-title text-xl">Painel de Presenças</h1>
        {selectedEvent ? (
          <p className="text-muted-foreground num mt-1 text-sm">
            {selectedEvent.name} · {eventTypeLabel(selectedEvent.event_type)} ·{" "}
            {formatDate(selectedEvent.date)} · {formatTime(selectedEvent.start_time)} ·{" "}
            {selectedEvent.location || "—"}
          </p>
        ) : (
          <p className="text-muted-foreground mt-1 text-sm">
            Cadastre um evento para iniciar os registros.
          </p>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      ) : isTraining ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total de inscritos" value={training.total} emphasis />
            <StatCard label="Funções distintas" value={training.functionRanking.length} />
            <StatCard
              label="Congregações presentes"
              value={`${training.presentHouses.length}/${training.activeHouses}`}
              hint={`${training.absentHouses.length} ausentes`}
            />
            <StatCard label="Idade média" value={training.averageAge.toFixed(1).replace(".", ",")} hint="anos" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Funções" description="Ranking do treinamento.">
              <RankTable rows={training.functionRanking} firstColumn="Função" limit={8} />
            </Panel>
            <Panel title="Congregações" description="Maiores participações.">
              <RankTable rows={training.presentHouses} firstColumn="Congregação" limit={8} />
            </Panel>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Comparecimento total" value={report.total} emphasis />
            <StatCard
              label="Com instrumento"
              value={report.withInstrument}
              hint={formatPercent(report.total ? (report.withInstrument / report.total) * 100 : 0)}
            />
            <StatCard
              label="Total de instrumentos"
              value={report.totalInstruments}
              hint="órgão conta como 1"
            />
            <StatCard
              label="Casas presentes"
              value={`${report.presentHouses.length}/${report.activeHouses}`}
              hint={`${report.absentHouses.length} ausentes`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Funções" description="Ranking parcial do evento ativo.">
              <RankTable rows={report.functionRanking} firstColumn="Função" limit={8} />
            </Panel>
            <Panel title="Instrumentos" description="Participantes e instrumentos em uso.">
              <InstrumentTable rows={report.instrumentRanking.slice(0, 8)} />
            </Panel>
          </div>

          {report.sectors.length > 0 && (
            <Panel title="Setores" description="Casas de oração presentes por setor.">
              <RankTable
                rows={report.sectors.map((s) => ({
                  name: `${s.name} (${s.present}/${s.totalHouses})`,
                  count: s.attendees,
                  percent: s.percent,
                }))}
                firstColumn="Setor"
              />
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
