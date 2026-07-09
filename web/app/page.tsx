import { prisma } from "@/lib/prisma";
import { getResumenAnual, getPendientes } from "@/lib/finanzas";
import { euro, euroExacto, fecha } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge } from "@/components/ui";
import { YearChart } from "@/components/YearChart";
import { estadoFactura, tipoPresupuesto } from "@/lib/estados";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();

  const [resumen, pendientes, noCompletados, enviados, ultimasFacturas] = await Promise.all([
    getResumenAnual(),
    getPendientes(),
    // Pedidos aceptados SIN factura => no completados
    prisma.presupuesto.findMany({
      where: { estado: "ACEPTADO", factura: { is: null } },
      include: { empresa: true, lineas: true },
      orderBy: { fecha: "desc" },
    }),
    prisma.presupuesto.count({ where: { estado: "ENVIADO" } }),
    prisma.factura.findMany({
      include: { empresa: true },
      orderBy: { fecha: "desc" },
      take: 6,
    }),
  ]);

  const esteAno = resumen.find((r) => r.year === year);
  const anoAnterior = resumen.find((r) => r.year === year - 1);
  const rentabilidad = esteAno?.rentabilidad ?? 0;
  const rentAnterior = anoAnterior?.rentabilidad ?? 0;
  const variacion = rentAnterior !== 0 ? (rentabilidad - rentAnterior) / Math.abs(rentAnterior) : 0;

  const totalLinea = (lineas: { cantidad: number; precioUnitario: number }[]) =>
    lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);

  return (
    <Page>
      <PageHeader
        title="Panel de control"
        subtitle={`Resumen de Lindilla S.L. · ${now.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`}
      />

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          label={`Beneficio ${year}`}
          value={euro(rentabilidad)}
          tone="green"
          sub={
            anoAnterior ? (
              <span className={variacion >= 0 ? "text-[var(--tone-green)]" : "text-[var(--tone-rose)]"}>
                {variacion >= 0 ? "▲" : "▼"} {Math.abs(variacion * 100).toFixed(0)}% vs {year - 1}
              </span>
            ) : (
              "Sin año anterior para comparar"
            )
          }
        />
        <StatCard
          label={`Facturado ${year}`}
          value={euro(esteAno?.ingresos ?? 0)}
          tone="sky"
          sub={`Cobrado: ${euro(esteAno?.cobrado ?? 0)}`}
        />
        <StatCard
          label="Pendiente de cobro"
          value={euro(pendientes.porCobrar)}
          tone="amber"
          sub={`${pendientes.facturasPend.length} factura(s) sin cobrar`}
        />
        <StatCard
          label="Pendiente de pago"
          value={euro(pendientes.porPagar)}
          tone="rose"
          sub={`${pendientes.gastosPend.length} gasto(s) sin pagar`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Comparativa anual */}
        <div className="lg:col-span-2">
          <Panel
            title="Comparativa anual"
            right={<Link href="/finanzas" className="text-[13px] text-[var(--tone-green)] hover:underline">Ver finanzas →</Link>}
          >
            <div className="p-5">
              <YearChart data={resumen} />
            </div>
          </Panel>
        </div>

        {/* Pedidos sin completar */}
        <Panel
          title="Pedidos sin completar"
          right={<Badge variant="amber">{noCompletados.length}</Badge>}
        >
          <div className="p-3">
            {noCompletados.length === 0 ? (
              <div className="px-3 py-8 text-center muted text-[14px]">Todo facturado 🎉</div>
            ) : (
              <ul className="flex flex-col gap-1">
                {noCompletados.map((p) => {
                  const t = tipoPresupuesto(p.tipo);
                  return (
                    <li key={p.id}>
                      <Link href="/presupuestos" className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors">
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium truncate">{p.empresa.nombre}</div>
                          <div className="muted-2 text-[12px]">{p.numero} · falta factura</div>
                        </div>
                        <div className="text-right flex-none">
                          <div className="text-[14px] font-semibold">{euro(totalLinea(p.lineas))}</div>
                          <Badge variant={t.variant}>{t.label}</Badge>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="px-3 pt-3 mt-1 border-t border-[var(--border-soft)] muted-2 text-[12px]">
              {enviados} presupuesto(s) enviados esperando respuesta.
              <br />
              Nada de esto suma en contabilidad hasta que haya factura.
            </div>
          </div>
        </Panel>
      </div>

      {/* Últimas facturas */}
      <div className="mt-5">
        <Panel
          title="Últimas facturas"
          right={<Link href="/facturas" className="text-[13px] text-[var(--tone-green)] hover:underline">Ver todas →</Link>}
        >
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th className="text-right">Importe</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimasFacturas.map((f) => {
                  const e = estadoFactura(f.estado);
                  return (
                    <tr key={f.id}>
                      <td className="font-mono text-[13px] muted">{f.numero}</td>
                      <td className="font-medium">{f.empresa.nombre}</td>
                      <td className="muted">{fecha(f.fecha)}</td>
                      <td className="text-right font-semibold">{euroExacto(f.total)}</td>
                      <td><Badge variant={e.variant}>{e.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
