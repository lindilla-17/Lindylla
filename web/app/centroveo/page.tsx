import { prisma } from "@/lib/prisma";
import { euro, euroExacto, fecha } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge, Empty } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Panel de CENTROVEO — actividad sanitaria de Lindilla S.L.
// Gestión independiente de la actividad de gorros (sus propios datos y apartados).
export default async function CentroveoPage() {
  const year = new Date().getFullYear();

  const [facturas, gastos] = await Promise.all([
    prisma.centroveoFactura.findMany({ orderBy: { fecha: "desc" } }),
    prisma.centroveoGasto.findMany({ orderBy: { fecha: "desc" } }),
  ]);

  const delAno = facturas.filter((f) => f.fecha.getFullYear() === year);
  const lentes = delAno.filter((f) => f.tipo === "LENTES");
  const profesionales = delAno.filter((f) => f.tipo === "PROFESIONAL");
  const gastosAno = gastos.filter((g) => g.fecha.getFullYear() === year);

  const sum = (xs: { neto: number }[]) => xs.reduce((s, x) => s + x.neto, 0);
  const pendienteCobro = facturas.filter((f) => f.estado === "PENDIENTE").reduce((s, f) => s + f.total, 0);

  const ultimas = facturas.slice(0, 8);

  return (
    <Page>
      <PageHeader
        title="Centroveo"
        subtitle="Actividad sanitaria de Lindilla S.L. — óptica y optometría. Gestión independiente de la actividad de gorros."
      />

      {/* KPIs del año */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label={`Venta de lentes ${year}`} value={euro(sum(lentes))} tone="sky" sub={`${lentes.length} factura(s) · IVA 10%`} />
        <StatCard label={`Servicios optometría ${year}`} value={euro(sum(profesionales))} tone="indigo" sub={`${profesionales.length} factura(s) · exentas de IVA`} />
        <StatCard label={`Gastos proveedores ${year}`} value={euro(sum(gastosAno))} tone="rose" sub={`${gastosAno.length} factura(s) recibidas`} />
        <StatCard label="Pendiente de cobro" value={euro(pendienteCobro)} tone="amber" sub="todas las series" />
      </div>

      {/* Agenda de trabajo → alimenta las facturas profesionales */}
      <Link href="/centroveo/agenda" className="card card-hover p-5 block mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-[15px]">📅 Agenda de trabajo</div>
          <p className="muted text-[13px] mt-1">
            Apunta tus consultas y cirugías día a día. Cada mes se convierte en una factura de trabajos profesionales.
          </p>
        </div>
        <span className="text-[13px] text-[var(--brand-teal-dark)] flex-none">Abrir →</span>
      </Link>

      {/* Apartados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <Apartado
          href="/centroveo/emitidas"
          titulo="Facturas emitidas"
          descripcion="Venta de lentes de contacto · IVA 10%"
          cantidad={facturas.filter((f) => f.tipo === "LENTES").length}
        />
        <Apartado
          href="/centroveo/proveedores"
          titulo="Facturas de proveedores"
          descripcion="Compras y gastos de la actividad"
          cantidad={gastos.length}
        />
        <Apartado
          href="/centroveo/profesionales"
          titulo="Facturas de trabajos profesionales"
          descripcion="Optometría en Hospital Vithas Xanit · exentas de IVA"
          cantidad={facturas.filter((f) => f.tipo === "PROFESIONAL").length}
        />
      </div>

      {/* Últimos movimientos */}
      <Panel title="Últimas facturas emitidas">
        {ultimas.length === 0 ? (
          <Empty>
            Aún no hay facturas de Centroveo.
            <br />
            Crea la primera desde cualquiera de los apartados de arriba.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimas.map((f) => (
                  <tr key={f.id}>
                    <td className="font-mono text-[13px] muted">{f.numero}</td>
                    <td>
                      <Badge variant={f.tipo === "LENTES" ? "sky" : "indigo"}>
                        {f.tipo === "LENTES" ? "Lentes" : "Optometría"}
                      </Badge>
                    </td>
                    <td className="font-medium">{f.cliente}</td>
                    <td className="muted">{fecha(f.fecha)}</td>
                    <td className="text-right font-semibold">{euroExacto(f.total)}</td>
                    <td>
                      <Badge variant={f.estado === "PAGADA" ? "green" : "amber"}>
                        {f.estado === "PAGADA" ? "Cobrada" : "Pendiente"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </Page>
  );
}

function Apartado({ href, titulo, descripcion, cantidad }: { href: string; titulo: string; descripcion: string; cantidad: number }) {
  return (
    <Link href={href} className="card card-hover p-5 block">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[15px]">{titulo}</span>
        <span className="badge badge-slate">{cantidad}</span>
      </div>
      <p className="muted text-[13px] mt-1.5">{descripcion}</p>
      <div className="text-[13px] text-[var(--brand-teal-dark)] mt-3">Abrir →</div>
    </Link>
  );
}
