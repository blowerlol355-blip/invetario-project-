import { NextResponse } from "next/server";

import { toCsv } from "@/features/reports/lib/csv";
import { buildReportPdf } from "@/features/reports/lib/pdf";
import { REPORT_KEYS, type ReportKey, REPORTS } from "@/features/reports/registry";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * Exportación de reportes: GET /api/reports/{inventory|kardex|movements}?format=csv|pdf&...filtros
 * Requiere sesión y el permiso reports:view.
 */
export async function GET(request: Request, context: { params: Promise<{ report: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (!hasPermission(session.user.role, "reports:view")) {
    return NextResponse.json({ error: "Sin permiso para ver reportes." }, { status: 403 });
  }

  const { report } = await context.params;
  if (!REPORT_KEYS.includes(report as ReportKey)) {
    return NextResponse.json({ error: "Reporte no encontrado." }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const params = Object.fromEntries(url.searchParams.entries());

  try {
    const table = await REPORTS[report as ReportKey](params);

    if (format === "csv") {
      const csv = toCsv(
        table.columns.map((column, index) => ({
          header: column.header,
          value: (row: (string | number | null)[]) => row[index],
        })),
        table.footer ? [...table.rows, table.footer] : table.rows,
      );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${table.filename}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const pdf = await buildReportPdf(table);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${table.filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[reports] error al generar el reporte:", error);
    return NextResponse.json({ error: "No se pudo generar el reporte." }, { status: 500 });
  }
}
