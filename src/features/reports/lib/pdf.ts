import "server-only";

import pdfmake from "pdfmake";
import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";

import type { ReportCell, ReportTable } from "@/features/reports/lib/report-table";
import { formatDateTime } from "@/lib/format";

/**
 * Fuentes estándar de PDFKit (Helvetica): no requieren archivos y cubren el juego
 * de caracteres latino con acentos y eñes, suficiente para los reportes.
 */
const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

pdfmake.setFonts(fonts);

interface CellObject {
  text: string;
  alignment: "left" | "right";
  bold: boolean;
  fontSize: number;
  margin: [number, number, number, number];
  fillColor?: string;
}

function cell(value: ReportCell, align: "left" | "right", bold = false): CellObject {
  return {
    text: value === null || value === undefined ? "" : String(value),
    alignment: align,
    bold,
    fontSize: 8,
    margin: [0, 2, 0, 2],
  };
}

/** Genera un PDF A4 (horizontal si hay muchas columnas) con cabecera, tabla y totales. */
export async function buildReportPdf(table: ReportTable): Promise<Buffer> {
  const landscape = table.columns.length > 6;
  const body: TableCell[][] = [
    table.columns.map((column) => ({
      text: column.header,
      bold: true,
      fontSize: 8,
      color: "#ffffff",
      fillColor: "#4f46e5",
      alignment: column.align ?? "left",
      margin: [0, 3, 0, 3],
    })),
    ...table.rows.map((row) =>
      row.map((value, index) => cell(value, table.columns[index]?.align ?? "left")),
    ),
  ];
  if (table.footer) {
    body.push(
      table.footer.map((value, index) => ({
        ...cell(value, table.columns[index]?.align ?? "left", true),
        fillColor: "#eef2ff",
      })),
    );
  }

  const content: Content[] = [
    { text: table.title, fontSize: 16, bold: true, margin: [0, 0, 0, 2] },
    { text: table.subtitle, fontSize: 9, color: "#6b7280", margin: [0, 0, 0, 12] },
    {
      table: {
        headerRows: 1,
        widths: table.columns.map((column) => column.width ?? "auto"),
        body,
      },
      layout: {
        hLineWidth: (i: number) => (i === 0 || i === 1 ? 0.8 : 0.3),
        vLineWidth: () => 0,
        hLineColor: () => "#d1d5db",
        paddingLeft: () => 6,
        paddingRight: () => 6,
      },
    },
  ];
  for (const note of table.notes ?? []) {
    content.push({ text: note, fontSize: 8, color: "#6b7280", margin: [0, 8, 0, 0] });
  }

  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: landscape ? "landscape" : "portrait",
    pageMargins: [32, 36, 32, 40],
    defaultStyle: { font: "Helvetica", fontSize: 9 },
    info: { title: table.title, author: "StockPilot" },
    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: `StockPilot · generado el ${formatDateTime(new Date())}`,
          fontSize: 7,
          color: "#9ca3af",
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          alignment: "right",
          fontSize: 7,
          color: "#9ca3af",
        },
      ],
      margin: [32, 12, 32, 0],
    }),
    content,
  };

  return pdfmake.createPdf(definition).getBuffer();
}
