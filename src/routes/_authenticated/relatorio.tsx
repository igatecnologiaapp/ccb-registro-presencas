import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  Panel,
  RankTable,
  StatCard,
} from "@/components/report-blocks";
import { useSelectedEvent } from "@/components/event-context";
import {
  useAttendees,
  useFunctions,
  useInstruments,
  usePrayerHouses,
} from "@/lib/data";
import { buildReport, formatDate, formatPercent, formatTime } from "@/lib/report";
import { generateReportPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/relatorio")({
  head: () => ({
    meta: [
      { title: "Relatório do Evento — Reunião Técnica Musical" },
      {
        name: "description",
        content:
          "Relatório estatístico com totais, ranking de funções e instrumentos, casas de oração presentes e ausentes, com exportação em PDF.",
      },
      { property: "og:title", content: "Relatório do Evento — Reunião Técnica Musical" },
      {
        property: "og:description",
        content: "Estatísticas completas da reunião técnica musical com exportação em PDF.",
      },
    ],
  }),
  component: ReportRoute,
});

function ReportRoute() {
  const { selectedEvent, selectedEventId } = useSelectedEvent();
  const attendees = useAttendees(selectedEventId);
  const functions = useFunctions();
  const instruments = useInstruments();
  const houses = usePrayerHouses();

  if (!selectedEvent) {
    return (
      <div className="mx-auto max-w-2xl">
        <Panel title="Nenhum evento selecionado">
          <EmptyBlock label="Selecione um evento para visualizar o relatório." />
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link to="/eventos">Ir para Eventos</Link>
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  const isLoading =
    attendees.isLoading || functions.isLoading || instruments.isLoading || houses.isLoading;
  const isError = attendees.isError || functions.isError || instruments.isError || houses.isError;

  if (isLoading) {
    return (
      <Panel title="Relatório">
        <LoadingBlock />
      </Panel>
    );
  }
  if (isError) {
    return (
      <Panel title="Relatório">
        <ErrorBlock />
      </Panel>
    );
  }

  const report = buildReport(
    attendees.data ?? [],
    functions.data ?? [],
    instruments.data ?? [],
    houses.data ?? [],
  );
  const activeHouses = (houses.data ?? []).filter((h) => h.active).length;
  const presentHouses = report.presentHouses.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="doc-title text-xl">Relatório do Evento</h1>
          <p className="text-muted-foreground num mt-1 text-sm">
            {selectedEvent.name} · {formatDate(selectedEvent.date)} ·{" "}
            {formatTime(selectedEvent.start_time)} · {selectedEvent.location || "—"}
          </p>
        </div>
        <Button
          onClick={() => {
            try {
              generateReportPdf(selectedEvent, report);
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
          disabled={report.total === 0}
        >
          <Download className="size-4" /> Exportar PDF
        </Button>
      </header>

      {report.total === 0 ? (
        <Panel title="Sem dados">
          <EmptyBlock label="Nenhuma presença registrada neste evento ainda." />
          <div className="mt-4 flex justify-center">
            <Button asChild variant="outline">
              <Link to="/presencas">Registrar presenças</Link>
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
              hint={formatPercent(
                report.total ? (report.withInstrument / report.total) * 100 : 0,
              )}
            />
            <StatCard label="Funções distintas" value={report.functionsUsed} />
            <StatCard
              label="Casas presentes"
              value={`${presentHouses}/${activeHouses}`}
              hint={`${report.absentHouses.length} ausentes`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Ranking por função" description="Ordem decrescente de quantidade.">
              <RankTable rows={report.functionRanking} firstColumn="Função" />
            </Panel>
            <Panel
              title="Ranking por instrumento"
              description="Percentual sobre o total de músicos com instrumento."
            >
              <RankTable rows={report.instrumentRanking} firstColumn="Instrumento" />
            </Panel>
          </div>

          <Panel
            title="Casas de oração presentes"
            description="Quantidade de participantes por localidade."
            actions={<Badge variant="secondary">{presentHouses} presentes</Badge>}
          >
            <RankTable rows={report.presentHouses} firstColumn="Casa de Oração" />
          </Panel>

          <Panel
            title="Casas de oração ausentes"
            actions={<Badge variant="outline">{report.absentHouses.length} ausentes</Badge>}
          >
            {report.absentHouses.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Todas as casas de oração ativas estiveram presentes.
              </p>
            ) : (
              <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {report.absentHouses.map((name) => (
                  <li key={name} className="border-border/60 truncate border-b py-1.5">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
