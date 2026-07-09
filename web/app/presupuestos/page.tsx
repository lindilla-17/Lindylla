import { prisma } from "@/lib/prisma";
import { euro, fecha } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge, Empty } from "@/components/ui";
import { estadoPresupuesto, tipoPresupuesto, pedidoCompletado } from "@/lib/estados";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const todos = await prisma.presupuesto.findMany({
    include: { empresa: true, lineas: true, factura: true },
    orderBy: { fecha: "desc" },
  });

  const anos = [...new Set(todos.map((p) => p.fecha.getFullYear()))].sort((a, b) => b - a);
  const anoParam = typeof params.ano === "string" ? parseInt(params.ano) : null;
  const anoSel = anoParam && anos.includes(anoParam) ? anoParam : null;
  const presupuestos = anoSel ? todos.filter((p) => p.fecha.getFullYear() === anoSel) : todos;

  const total = (lineas: { cantidad: number; precioUnitario: number }[]) =>
    lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);

  const aceptados = presupuestos.filter((p) => p.estado === "ACEPTADO");
  const completados = aceptados.filter((p) => p.factura);
  const sinFactura = aceptados.filter((p) => !p.factura);

  return (
    <Page>
      <PageHeader
        title="Presupuestos"
        subtitle="Pedidos de gorros y congresos. Un pedido se considera completado cuando tiene su factura."
      />

      {/* Pestañas por año */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <YearTab href="/presupuestos" label="Todos" active={anoSel === null} />
        {anos.map((a) => (
          <YearTab key={a} href={`/presupuestos?ano=${a}`} label={String(a)} active={anoSel === a} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
        <StatCard label="Presupuestos" value={String(presupuestos.length)} />
        <StatCard label="Aceptados" value={String(aceptados.length)} tone="sky" />
        <StatCard label="Completados" value={String(completados.length)} tone="green" sub="con factura emitida" />
        <StatCard label="Falta facturar" value={String(sinFactura.length)} tone="amber" sub="aceptados sin factura" />
      </div>

      <Panel title={`Listado (${presupuestos.length})`}>
        {presupuestos.length === 0 ? (
          <Empty>
            Todavía no hay presupuestos registrados.
            <br />
            <span className="muted-2 text-[13px]">
              Los datos inventados se han eliminado — aquí solo entrará lo real. El siguiente paso es
              poder crear presupuestos desde esta pantalla.
            </span>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Cliente</th>
                  <th>Concepto</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th className="text-right">Importe</th>
                  <th>Estado</th>
                  <th>Pedido</th>
                </tr>
              </thead>
              <tbody>
                {presupuestos.map((p) => {
                  const est = estadoPresupuesto(p.estado);
                  const tip = tipoPresupuesto(p.tipo);
                  const completado = pedidoCompletado(p.estado, !!p.factura);
                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-[13px] muted whitespace-nowrap">{p.numero}</td>
                      <td className="font-medium whitespace-nowrap">{p.empresa.nombre}</td>
                      <td className="muted text-[13px] max-w-[280px]">
                        {p.lineas[0]?.concepto ?? "—"}
                        {p.notas && <div className="muted-2 text-[11px] mt-0.5">{p.notas}</div>}
                      </td>
                      <td><Badge variant={tip.variant}>{tip.label}</Badge></td>
                      <td className="muted whitespace-nowrap">{fecha(p.fecha)}</td>
                      <td className="text-right font-semibold whitespace-nowrap">
                        {total(p.lineas) > 0 ? euro(total(p.lineas)) : <span className="muted-2">—</span>}
                      </td>
                      <td><Badge variant={est.variant}>{est.label}</Badge></td>
                      <td>
                        {p.estado === "ACEPTADO" ? (
                          completado ? (
                            <Badge variant="green">✓ Completado</Badge>
                          ) : (
                            <Badge variant="amber">Falta factura</Badge>
                          )
                        ) : (
                          <span className="muted-2 text-[13px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </Page>
  );
}

function YearTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
        active
          ? "bg-[var(--accent-soft)] border-[rgba(78,143,132,.4)] text-[var(--brand-teal-dark)]"
          : "border-[var(--border)] muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
      }`}
    >
      {label}
    </Link>
  );
}
