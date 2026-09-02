import { prisma } from "@/lib/prisma";
import { euro, euroExacto, fecha } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge, ActionLink, Empty } from "@/components/ui";
import { CentroveoToggle, CentroveoBorrar } from "@/components/CentroveoControles";
import { trimestreDeFecha } from "@/lib/fechas";
import { FiltroTrimestre } from "@/components/FiltroTrimestre";
import Link from "next/link";

// Listado compartido de facturas emitidas de Centroveo, filtrado por tipo.
// Lo usan /centroveo/emitidas (LENTES) y /centroveo/profesionales (PROFESIONAL).
export async function ListaFacturasCentroveo({
  tipo,
  titulo,
  subtitulo,
  etiquetaIva,
  basePath,
  searchParams,
}: {
  tipo: "LENTES" | "PROFESIONAL";
  titulo: string;
  subtitulo: string;
  etiquetaIva: string;
  basePath: string;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const todas = await prisma.centroveoFactura.findMany({
    where: { tipo },
    orderBy: { fecha: "desc" },
  });

  const anos = [...new Set(todas.map((f) => f.fecha.getFullYear()))].sort((a, b) => b - a);
  const hoy = new Date();
  const sinFiltros = !params.ano && !params.trimestre;
  const anoActualTieneDatos = anos.includes(hoy.getFullYear());

  const anoParam = typeof params.ano === "string" ? parseInt(params.ano) : null;
  const anoSel = anoParam && anos.includes(anoParam) ? anoParam : sinFiltros && anoActualTieneDatos ? hoy.getFullYear() : anos[0] ?? hoy.getFullYear();

  const trimestreParam = params.trimestre;
  const trimestreSel =
    trimestreParam === "todos"
      ? null
      : typeof trimestreParam === "string" && ["1", "2", "3", "4"].includes(trimestreParam)
        ? parseInt(trimestreParam)
        : sinFiltros && anoActualTieneDatos
          ? trimestreDeFecha(hoy)
          : null;

  const facturas = todas.filter((f) => f.fecha.getFullYear() === anoSel && (trimestreSel === null || trimestreDeFecha(f.fecha) === trimestreSel));

  const neto = facturas.reduce((s, f) => s + f.neto, 0);
  const iva = facturas.reduce((s, f) => s + f.iva, 0);
  const total = facturas.reduce((s, f) => s + f.total, 0);
  const cobrado = facturas.filter((f) => f.estado === "PAGADA").reduce((s, f) => s + f.total, 0);

  return (
    <Page>
      <PageHeader
        title={titulo}
        subtitle={subtitulo}
        action={<ActionLink href={`/centroveo/nueva?tipo=${tipo}`}>+ Nueva factura</ActionLink>}
      />

      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <Link href="/centroveo" className="text-[13px] text-[var(--brand-teal-dark)] hover:underline">← Volver a Centroveo</Link>
        {tipo === "PROFESIONAL" && (
          <Link href="/centroveo/agenda" className="text-[13px] muted hover:text-[var(--text)] hover:underline">
            📅 Ir a la agenda de trabajo →
          </Link>
        )}
      </div>

      <FiltroTrimestre basePath={basePath} anos={anos} anoSel={anoSel} trimestreSel={trimestreSel} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Base sin IVA" value={euro(neto)} tone="sky" sub={`${facturas.length} factura(s)`} />
        <StatCard label={etiquetaIva} value={euro(iva)} tone="indigo" />
        <StatCard label="Total" value={euro(total)} />
        <StatCard label="Cobrado" value={euro(cobrado)} tone="green" sub={`Pendiente: ${euro(total - cobrado)}`} />
      </div>

      <Panel title={`Listado (${facturas.length})`}>
        {facturas.length === 0 ? (
          <Empty>Aún no hay facturas en este apartado. Usa «+ Nueva factura» para crear la primera.</Empty>
        ) : (
          <>
            {/* Tarjetas (móvil): todo visible de un vistazo, sin deslizar */}
            <div className="lg:hidden flex flex-col gap-3 p-3">
              {facturas.map((f) => (
                <div key={f.id} className="rounded-xl border border-[var(--border)] p-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[12px] muted">{f.numero} · {fecha(f.fecha)}</div>
                      <div className="font-semibold text-[15px] truncate">{f.cliente}</div>
                    </div>
                    <Badge variant={f.estado === "PAGADA" ? "green" : "amber"}>
                      {f.estado === "PAGADA" ? "Cobrada" : "Pendiente"}
                    </Badge>
                  </div>
                  {f.concepto && <div className="muted text-[13px]">{f.concepto}</div>}
                  <div className="flex items-baseline justify-between pt-1 border-t border-[var(--border-soft)]">
                    <span className="muted-2 text-[12px]">
                      {euroExacto(f.neto)} + {f.iva !== 0 ? `IVA ${euroExacto(f.iva)}` : "exenta"}
                    </span>
                    <span className="font-bold text-[18px]">{euroExacto(f.total)}</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <Link
                      href={`/centroveo/facturas/${f.id}/imprimir`}
                      className="flex-1 text-center rounded-lg bg-[var(--brand-teal-dark)] text-white text-[13px] font-semibold py-2"
                    >
                      🖨 Ver / Descargar PDF
                    </Link>
                    <CentroveoToggle id={f.id} marcado={f.estado === "PAGADA"} />
                  </div>
                  <div className="text-right">
                    <CentroveoBorrar id={f.id} numero={f.numero} />
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla (ordenador) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Cliente</th>
                    <th>Concepto</th>
                    <th>Fecha</th>
                    <th className="text-right">Sin IVA</th>
                    <th className="text-right">IVA</th>
                    <th className="text-right">Total</th>
                    <th>Estado</th>
                    <th className="sticky right-0 bg-[var(--surface)]"></th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f) => (
                    <tr key={f.id}>
                      <td className="font-mono text-[13px] muted whitespace-nowrap">{f.numero}</td>
                      <td className="font-medium whitespace-nowrap">{f.cliente}</td>
                      <td className="muted text-[13px] max-w-[280px]">
                        {f.concepto ?? "—"}
                        {f.notas && <div className="muted-2 text-[11px] mt-0.5">{f.notas}</div>}
                      </td>
                      <td className="muted whitespace-nowrap">{fecha(f.fecha)}</td>
                      <td className="text-right whitespace-nowrap">{euroExacto(f.neto)}</td>
                      <td className="text-right whitespace-nowrap">
                        {f.iva !== 0 ? <span className="muted">{euroExacto(f.iva)}</span> : <span className="muted-2 text-[12px]">exenta</span>}
                      </td>
                      <td className="text-right font-semibold whitespace-nowrap">{euroExacto(f.total)}</td>
                      <td>
                        <Badge variant={f.estado === "PAGADA" ? "green" : "amber"}>
                          {f.estado === "PAGADA" ? "Cobrada" : "Pendiente"}
                        </Badge>
                      </td>
                      {/* Columna fija a la derecha: siempre visible aunque se deslice la tabla */}
                      <td className="sticky right-0 bg-[var(--surface)] whitespace-nowrap pl-3 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/centroveo/facturas/${f.id}/imprimir`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand-teal-dark)] text-white text-[12px] font-semibold px-3 py-1.5 hover:opacity-90 transition-opacity"
                          >
                            🖨 Descargar
                          </Link>
                          <CentroveoToggle id={f.id} marcado={f.estado === "PAGADA"} />
                        </div>
                        <div className="mt-1 text-right">
                          <CentroveoBorrar id={f.id} numero={f.numero} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </Page>
  );
}
