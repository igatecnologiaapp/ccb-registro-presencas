import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EventRow } from "./data";
import { formatDate, formatPercent, formatTime, type ReportData } from "./report";

const INK: [number, number, number] = [38, 52, 64];
const HEAD: [number, number, number] = [45, 74, 90];
const LINE: [number, number, number] = [205, 213, 219];

export function generateReportPdf(event: EventRow, report: ReportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;

  // Header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("CONGREGAÇÃO CRISTÃ NO BRASIL", pageWidth / 2, 16, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(17);
  doc.text(event.name.toUpperCase(), pageWidth / 2, 25, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Data: ${formatDate(event.date)}     Hora: ${formatTime(event.start_time)}     Local: ${event.location || "—"}`,
    pageWidth / 2,
    32,
    { align: "center" },
  );

  doc.setDrawColor(...LINE);
  doc.line(margin, 36, pageWidth - margin, 36);

  // Total attendance highlight
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("COMPARECIMENTO TOTAL", pageWidth / 2, 46, { align: "center" });
  doc.setFont("times", "bold");
  doc.setFontSize(34);
  doc.text(String(report.total), pageWidth / 2, 60, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `Comparecimento por Instrumento: ${report.withInstrument}     Sem instrumento: ${report.withoutInstrument}`,
    pageWidth / 2,
    68,
    { align: "center" },
  );
  doc.text(
    `Casas de Oração presentes: ${report.presentHouses.length}     Casas de Oração ausentes: ${report.absentHouses.length}`,
    pageWidth / 2,
    74,
    { align: "center" },
  );

  let cursor = 82;

  const section = (title: string) => {
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(title, margin, cursor);
    cursor += 3;
  };

  const table = (
    head: string[],
    body: (string | number)[][],
    columnStyles?: Record<string, Record<string, unknown>>,
  ) => {
    autoTable(doc, {
      startY: cursor,
      margin: { left: margin, right: margin },
      head: [head],
      body,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.6, textColor: INK, lineColor: LINE },
      headStyles: { fillColor: HEAD, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [244, 247, 249] },
      columnStyles: (columnStyles ?? {}) as never,
    });
    // @ts-expect-error autoTable augments the doc instance at runtime
    cursor = (doc.lastAutoTable?.finalY ?? cursor) + 10;
  };

  section("Ranking de Funções");
  table(
    ["Função", "Qt", "%"],
    report.functionRanking.length
      ? report.functionRanking.map((r) => [r.name, r.count, formatPercent(r.percent)])
      : [["Nenhum registro", "0", "0,00%"]],
    { 1: { halign: "right", cellWidth: 18 }, 2: { halign: "right", cellWidth: 22 } },
  );

  section("Ranking de Instrumentos");
  table(
    ["Instrumento", "Qt", "%"],
    report.instrumentRanking.length
      ? report.instrumentRanking.map((r) => [r.name, r.count, formatPercent(r.percent)])
      : [["Nenhum registro", "0", "0,00%"]],
    { 1: { halign: "right", cellWidth: 18 }, 2: { halign: "right", cellWidth: 22 } },
  );

  section(`Casas de Oração Presentes: ${report.presentHouses.length}`);
  table(
    ["Casa de Oração", "Qt", "%"],
    report.presentHouses.length
      ? report.presentHouses.map((r) => [r.name, r.count, formatPercent(r.percent)])
      : [["Nenhuma casa de oração presente", "0", "0,00%"]],
    { 1: { halign: "right", cellWidth: 18 }, 2: { halign: "right", cellWidth: 22 } },
  );

  section(`Casas de Oração Ausentes: ${report.absentHouses.length}`);
  const absentRows: string[][] = [];
  for (let i = 0; i < report.absentHouses.length; i += 2) {
    absentRows.push([report.absentHouses[i] ?? "", report.absentHouses[i + 1] ?? ""]);
  }
  table(
    ["Ausentes", "Ausentes"],
    absentRows.length ? absentRows : [["Nenhuma casa de oração ausente", ""]],
  );

  // Footer: page numbers + generation timestamp
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

  const slug = event.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  doc.save(`${slug || "relatorio"}_${event.date}.pdf`);
}
