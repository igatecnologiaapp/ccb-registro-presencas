import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { eventTypeLabel, type EventRow } from "./data";
import {
  formatCpf,
  formatDate,
  formatPercent,
  formatTime,
  ageFrom,
  type ReportData,
  type TrainingReportData,
} from "./report";

const INK: [number, number, number] = [38, 52, 64];
const HEAD: [number, number, number] = [45, 74, 90];
const LINE: [number, number, number] = [205, 213, 219];

type Doc = jsPDF;

function slugify(event: EventRow) {
  return (
    event.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "relatorio"
  );
}

function header(doc: Doc, event: EventRow, pageWidth: number, margin: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text("CONGREGAÇÃO CRISTÃ NO BRASIL", pageWidth / 2, 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Registros de Presenças — Reuniões e Treinamentos", pageWidth / 2, 21, {
    align: "center",
  });

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(event.name.toUpperCase(), pageWidth / 2, 30, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `${eventTypeLabel(event.event_type)}  ·  Data: ${formatDate(event.date)}  ·  Hora: ${formatTime(
      event.start_time,
    )}  ·  Local: ${event.location || "—"}`,
    pageWidth / 2,
    36,
    { align: "center" },
  );

  doc.setDrawColor(...LINE);
  doc.line(margin, 40, pageWidth - margin, 40);
}

function footer(doc: Doc, pageWidth: number, margin: number) {
  const generated = new Date().toLocaleString("pt-BR");
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    const h = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 140);
    doc.text(`Emitido em ${generated}`, margin, h - 8);
    doc.text(`Página ${p} de ${pages}`, pageWidth - margin, h - 8, { align: "right" });
  }
}

function makeHelpers(doc: Doc, margin: number, startCursor: number) {
  const state = { cursor: startCursor };

  const section = (title: string) => {
    if (state.cursor > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      state.cursor = 20;
    }
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(title, margin, state.cursor);
    state.cursor += 3;
  };

  const table = (
    head: string[],
    body: (string | number)[][],
    columnStyles?: Record<string, Record<string, unknown>>,
  ) => {
    autoTable(doc, {
      startY: state.cursor,
      margin: { left: margin, right: margin },
      head: [head],
      body,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 1.6,
        textColor: INK,
        lineColor: LINE,
      },
      headStyles: { fillColor: HEAD, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [244, 247, 249] },
      columnStyles: (columnStyles ?? {}) as never,
    });
    // @ts-expect-error autoTable augments the doc instance at runtime
    state.cursor = (doc.lastAutoTable?.finalY ?? state.cursor) + 10;
  };

  return { section, table, state };
}

const QTY = { 1: { halign: "right", cellWidth: 18 }, 2: { halign: "right", cellWidth: 22 } };

export function generateReportPdf(event: EventRow, report: ReportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;

  header(doc, event, pageWidth, margin);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("COMPARECIMENTO TOTAL", pageWidth / 2, 50, { align: "center" });
  doc.setFont("times", "bold");
  doc.setFontSize(32);
  doc.text(String(report.total), pageWidth / 2, 63, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `Comparecimento por Instrumento: ${report.withInstrument}     Total de Instrumentos: ${report.totalInstruments}     Sem instrumento: ${report.withoutInstrument}`,
    pageWidth / 2,
    71,
    { align: "center" },
  );
  doc.text(
    `Casas de Oração presentes: ${report.presentHouses.length} de ${report.activeHouses}     Ausentes: ${report.absentHouses.length}`,
    pageWidth / 2,
    77,
    { align: "center" },
  );

  const { section, table } = makeHelpers(doc, margin, 87);

  section("Ranking de Funções");
  table(
    ["Função", "Qt", "%"],
    report.functionRanking.length
      ? report.functionRanking.map((r) => [r.name, r.count, formatPercent(r.percent)])
      : [["Nenhum registro", "0", "0,00%"]],
    QTY,
  );

  section("Ranking de Instrumentos");
  table(
    ["Instrumento", "Participantes", "Instrumentos", "%"],
    report.instrumentRanking.length
      ? report.instrumentRanking.map((r) => [
          r.shared ? `${r.name} (compartilhado)` : r.name,
          r.count,
          r.instruments,
          formatPercent(r.percent),
        ])
      : [["Nenhum registro", "0", "0", "0,00%"]],
    {
      1: { halign: "right", cellWidth: 26 },
      2: { halign: "right", cellWidth: 26 },
      3: { halign: "right", cellWidth: 22 },
    },
  );

  section(`Casas de Oração Presentes: ${report.presentHouses.length}`);
  table(
    ["Casa de Oração", "Representantes", "%"],
    report.presentHouses.length
      ? report.presentHouses.map((r) => [r.name, r.count, formatPercent(r.percent)])
      : [["Nenhuma casa de oração presente", "0", "0,00%"]],
    { 1: { halign: "right", cellWidth: 30 }, 2: { halign: "right", cellWidth: 22 } },
  );

  section(`Casas de Oração Ausentes: ${report.absentHouses.length}`);
  const absentRows: string[][] = [];
  for (let i = 0; i < report.absentHouses.length; i += 2) {
    absentRows.push([report.absentHouses[i] ?? "", report.absentHouses[i + 1] ?? ""]);
  }
  table(
    ["Casa de Oração", "Casa de Oração"],
    absentRows.length ? absentRows : [["Nenhuma casa de oração ausente", ""]],
  );

  if (report.sectors.length) {
    section("Resumo por Setor (complementar)");
    table(
      ["Setor", "Presentes", "Ausentes", "Participantes", "%"],
      report.sectors.map((s) => [
        s.name,
        `${s.present}/${s.totalHouses}`,
        s.absent,
        s.attendees,
        formatPercent(s.percent),
      ]),
      {
        1: { halign: "right", cellWidth: 24 },
        2: { halign: "right", cellWidth: 22 },
        3: { halign: "right", cellWidth: 26 },
        4: { halign: "right", cellWidth: 22 },
      },
    );
  }

  footer(doc, pageWidth, margin);
  doc.save(`${slugify(event)}_${event.date}.pdf`);
}

export function generateTrainingPdf(
  event: EventRow,
  report: TrainingReportData,
  participants: {
    full_name: string;
    cpf: string;
    birth_date: string;
    house: string;
    fn: string;
  }[],
) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;

  header(doc, event, pageWidth, margin);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("PARTICIPANTES INSCRITOS", pageWidth / 2, 50, { align: "center" });
  doc.setFont("times", "bold");
  doc.setFontSize(32);
  doc.text(String(report.total), pageWidth / 2, 63, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `Congregações presentes: ${report.presentHouses.length} de ${report.activeHouses}     Ausentes: ${report.absentHouses.length}     Idade média: ${report.averageAge.toFixed(1)}`,
    pageWidth / 2,
    71,
    { align: "center" },
  );

  const { section, table } = makeHelpers(doc, margin, 82);

  section("Relação de Participantes");
  table(
    ["#", "Nome completo", "CPF", "Nascimento", "Idade", "Congregação", "Função"],
    participants.length
      ? participants.map((p, i) => [
          i + 1,
          p.full_name,
          formatCpf(p.cpf),
          formatDate(p.birth_date),
          ageFrom(p.birth_date),
          p.house,
          p.fn,
        ])
      : [["", "Nenhum participante inscrito", "", "", "", "", ""]],
    {
      0: { halign: "right", cellWidth: 8 },
      2: { cellWidth: 24 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 12, halign: "right" },
    },
  );

  section("Ranking de Funções");
  table(
    ["Função", "Qt", "%"],
    report.functionRanking.length
      ? report.functionRanking.map((r) => [r.name, r.count, formatPercent(r.percent)])
      : [["Nenhum registro", "0", "0,00%"]],
    QTY,
  );

  if (report.sectors.length) {
    section("Resumo por Setor");
    table(
      ["Setor", "Presentes", "Ausentes", "Participantes", "%"],
      report.sectors.map((s) => [
        s.name,
        `${s.present}/${s.totalHouses}`,
        s.absent,
        s.attendees,
        formatPercent(s.percent),
      ]),
      {
        1: { halign: "right", cellWidth: 24 },
        2: { halign: "right", cellWidth: 22 },
        3: { halign: "right", cellWidth: 26 },
        4: { halign: "right", cellWidth: 22 },
      },
    );
  }

  section(`Congregações Presentes: ${report.presentHouses.length}`);
  table(
    ["Congregação", "Qt", "%"],
    report.presentHouses.length
      ? report.presentHouses.map((r) => [r.name, r.count, formatPercent(r.percent)])
      : [["Nenhuma congregação presente", "0", "0,00%"]],
    QTY,
  );

  footer(doc, pageWidth, margin);
  doc.save(`treinamento_${slugify(event)}_${event.date}.pdf`);
}
