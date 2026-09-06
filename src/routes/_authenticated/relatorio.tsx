import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  EmptyBlock,
  ErrorBlock,
  InstrumentTable,
  LoadingBlock,
  Panel,
  RankTable,
  SectorPanels,
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
  nameMap,
} from "@/lib/report";
import { generateReportPdf, generateTrainingPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/relatorio")({
  head: () => ({
    meta: [
      { title: "Relatório do Evento — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Relatório estatístico com totais, rankings de funções e instrumentos, totais por setor e casas de oração presentes e ausentes, com exportação em PDF.",
      },
      { property: "og:title", content: "Relatório do Evento — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Estatísticas completas do evento por função, instrumento e setor, com PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportRoute,
});

function ReportRoute() {
  const { selectedEvent, selectedEventId } = useSelectedEvent();
  const isTraining = selectedEvent?.event_type === "treinamento";

  const attendees = useAttendees(isTraining ? null : selectedEventId);
  const trainees = useTrainingAttendees(isTraining ? selectedEventId : null);
  const functions = useFunctions();
  const instruments = useInstruments();
  const houses = usePrayerHouses();
  const sectors = useSectors();

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
    (isTraining ? trainees.isLoading : attendees.isLoading) ||
    functions.isLoading ||
    instruments.isLoading ||
    houses.isLoading ||
    sectors.isLoading;
  const isError =
    (isTraining ? trainees.isError : attendees.isError) ||
    functions.isError ||
    instruments.isError ||
    houses.isError ||
    sectors.isError;

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

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="doc-title text-xl">Relatório do Evento</h1>
        <p className="text-muted-foreground num mt-1 text-sm">
          {selectedEvent.name} · {eventTypeLabel(selectedEvent.event_type)} ·{" "}
          {formatDate(selectedEvent.date)} · {formatTime(selectedEvent.start_time)} ·{" "}
          {selectedEvent.location || "—"}
        </p>
      </div>
      {isTraining ? (
        <Button
          onClick={() => {
            const houseNames = nameMap(houses.data ?? []);
            const functionNames = nameMap(functions.data ?? []);
            try {
              generateTrainingPdf(
                selectedEvent,
                buildTrainingReport(
                  trainees.data ?? [],
                  functions.data ?? [],
                  houses.data ?? [],
                  sectors.data ?? [],
                ),
                [...(trainees.data ?? [])]
                  .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"))
                  .map((r) => ({
                    full_name: r.full_name,
                    cpf: r.cpf,
                    birth_date: r.birth_date,
                    house: houseNames.get(r.prayer_house_id) ?? "—",
                    fn: functionNames.get(r.function_id) ?? "—",
                  })),
              );
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
          disabled={(trainees.data ?? []).length === 0}
        >
          <Download className="size-4" /> Exportar PDF
        </Button>
      ) : (
        <Button
          onClick={() => {
            try {
              generateReportPdf(
                selectedEvent,
                buildReport(
                  attendees.data ?? [],
                  functions.data ?? [],
                  instruments.data ?? [],
                  houses.data ?? [],
                  sectors.data ?? [],
                ),
              );
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
          disabled={(attendees.data ?? []).length === 0}
        >
          <Download className="size-4" /> Exportar PDF
        </Button>
      )}
    </header>
  );

  if (isTraining) {
    const report = buildTrainingReport(
      trainees.data ?? [],
      functions.data ?? [],
      houses.data ?? [],
      sectors.data ?? [],
    );

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {header}
        {report.total === 0 ? (
          <Panel title="Sem dados">
            <EmptyBlock label="Nenhuma inscrição registrada neste treinamento." />
            <div className="mt-4 flex justify-center">
              <Button asChild variant="outline">
                <Link to="/treinamento">Registrar inscrições</Link>
              </Button>
            </div>
          </Panel>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total de inscritos" value={report.total} emphasis />
              <StatCard label="Funções distintas" value={report.functionRanking.length} />
              <StatCard
                label="Congregações presentes"
                value={`${report.presentHouses.length}/${report.activeHouses}`}
                hint={`${report.absentHouses.length} ausentes`}
              />
              <StatCard label="Idade média" value={report.averageAge.toFixed(1).replace(".", ",")} hint="anos" />
            </div>

            <Panel title="Ranking por função" description="Ordem decrescente de quantidade.">
              <RankTable rows={report.functionRanking} firstColumn="Função" />
            </Panel>

            <SectorPanels sectors={report.sectors} houseLabel="Congregação" />
          </>
        )}
      </div>
    );
  }

  const report = buildReport(
    attendees.data ?? [],
    functions.data ?? [],
    instruments.data ?? [],
    houses.data ?? [],
    sectors.data ?? [],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {header}

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
            <Panel title="Ranking por função" description="Ordem decrescente de quantidade.">
              <RankTable rows={report.functionRanking} firstColumn="Função" />
            </Panel>
            <Panel
              title="Ranking por instrumento"
              description="Percentual sobre o total de participantes com instrumento."
            >
              <InstrumentTable rows={report.instrumentRanking} />
            </Panel>
          </div>

          <Panel
            title="Casas de oração presentes"
            description="Quantidade de participantes por localidade."
            actions={<Badge variant="secondary">{report.presentHouses.length} presentes</Badge>}
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

          <SectorPanels sectors={report.sectors} />
        </>
      )}
    </div>
  );
}
