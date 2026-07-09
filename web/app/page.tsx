import { prisma } from "@/lib/prisma";
import { getResumenAnual, getPendientes } from "@/lib/finanzas";
import { euro, euroExacto, fecha } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge } from "@/components/ui";
import { YearChart } from "@/components/YearChart";
import { estadoFactura, tipoPresupuesto } from "@/lib/estados";
import Link from "next/link";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Busca el logo de Centroveo en /public (centroveo.png/.jpg/.jpeg/.svg/.webp).
// Si la dueña deja el archivo ahí, aparece solo; si no, no se rompe nada.
function logoCentroveo(): string | null {
  const dir = path.join(process.cwd(), "public");
  for (const ext of ["png", "jpg", "jpeg", "svg", "webp"]) {
    if (fs.existsSync(path.join(dir, `centroveo.${ext}`))) return `/centroveo.${ext}`;
  }
  return null;
}

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

  // --- Centroveo (actividad sanitaria, columna derecha; datos independientes) ---
  const [cvFacturas, cvGastos] = await Promise.all([
    prisma.centroveoFactura.findMany(),
    prisma.centroveoGasto.findMany(),
  ]);
  const cvAno = cvFacturas.filter((f) => f.fecha.getFullYear() === year);
  const cvLentes = cvAno.filter((f) => f.tipo === "LENTES").reduce((s, f) => s + f.neto, 0);
  const cvServicios = cvAno.filter((f) => f.tipo === "PROFESIONAL").reduce((s, f) => s + f.neto, 0);
  const cvGastosAno = cvGastos.filter((g) => g.fecha.getFullYear() === year).reduce((s, g) => s + g.neto, 0);
  const cvPendiente = cvFacturas.filter((f) => f.estado === "PENDIENTE").reduce((s, f) => s + f.total, 0);

  return (
    <div className="flex flex-col xl:flex-row items-stretch">
      <div className="flex-1 min-w-0">
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
      </div>

      {/* ============================================================
          CENTROVEO — actividad sanitaria de Lindilla S.L.
          Columna independiente: misma web, gestión y datos separados
          de la actividad de gorros.
          ============================================================ */}
      <aside className="w-full xl:w-[320px] flex-none border-t xl:border-t-0 xl:border-l border-[var(--border)] bg-[var(--side)] px-6 py-7">
        <div className="mb-5">
          {logoCentroveo() ? (
            <Link href="/centroveo" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoCentroveo()!} alt="Centroveo" className="h-14 w-auto" />
              <div>
                <div className="font-semibold text-[17px] leading-tight">Centroveo</div>
                <div className="muted-2 text-[12px] leading-tight">Actividad sanitaria</div>
              </div>
            </Link>
          ) : (
            <h2 className="text-[20px] font-semibold tracking-tight">Centroveo</h2>
          )}
          <p className="muted text-[13px] mt-2">
            Actividad sanitaria · óptica y optometría.
            <br />
            Gestión independiente de los gorros.
          </p>
        </div>

        {/* Mini-resumen del año */}
        <div className="grid grid-cols-2 xl:grid-cols-1 gap-3 mb-5">
          <MiniStat label={`Venta de lentes ${year}`} value={euro(cvLentes)} sub="IVA 10%" />
          <MiniStat label={`Servicios optometría ${year}`} value={euro(cvServicios)} sub="Vithas Xanit · exentas de IVA" />
          <MiniStat label={`Gastos proveedores ${year}`} value={euro(cvGastosAno)} />
          <MiniStat label="Pendiente de cobro" value={euro(cvPendiente)} />
        </div>

        {/* Apartados */}
        <nav className="flex flex-col gap-2">
          <CentroveoLink href="/centroveo/agenda" titulo="📅 Agenda de trabajo" detalle="Consultas y cirugías día a día" />
          <CentroveoLink href="/centroveo/emitidas" titulo="Facturas emitidas" detalle="Lentes de contacto · IVA 10%" />
          <CentroveoLink href="/centroveo/proveedores" titulo="Facturas de proveedores" detalle="Compras de la actividad" />
          <CentroveoLink href="/centroveo/profesionales" titulo="Facturas de trabajos profesionales" detalle="Optometría · exentas de IVA" />
        </nav>

        <Link
          href="/centroveo"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-soft)] border border-[rgba(78,143,132,.3)] text-[var(--brand-teal-dark)] px-3.5 py-2 text-[13px] font-medium hover:bg-[rgba(78,143,132,.22)] transition-colors"
        >
          Abrir panel Centroveo →
        </Link>
      </aside>
    </div>
  );
}

/* Tarjeta pequeña de la columna Centroveo */
function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-3.5">
      <div className="muted text-[12px] font-medium">{label}</div>
      <div className="text-[18px] font-semibold tracking-tight mt-1">{value}</div>
      {sub && <div className="muted-2 text-[11px] mt-0.5">{sub}</div>}
    </div>
  );
}

/* Enlace a un apartado de Centroveo */
function CentroveoLink({ href, titulo, detalle }: { href: string; titulo: string; detalle: string }) {
  return (
    <Link href={href} className="card card-hover px-4 py-3 block">
      <div className="text-[14px] font-medium">{titulo}</div>
      <div className="muted-2 text-[12px] mt-0.5">{detalle}</div>
    </Link>
  );
}
