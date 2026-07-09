import { prisma } from "@/lib/prisma";
import { euro, euroExacto, fecha } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge, ActionLink, Empty } from "@/components/ui";
import { CentroveoToggle, CentroveoBorrar } from "@/components/CentroveoControles";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Centroveo · Facturas de proveedores (compras de lentes, material óptico...)
export default async function ProveedoresPage() {
  const gastos = await prisma.centroveoGasto.findMany({ orderBy: { fecha: "desc" } });

  const neto = gastos.reduce((s, g) => s + g.neto, 0);
  const iva = gastos.reduce((s, g) => s + g.iva, 0);
  const total = gastos.reduce((s, g) => s + g.importe, 0);
  const pagado = gastos.filter((g) => g.estado === "PAGADO").reduce((s, g) => s + g.importe, 0);

  return (
    <Page>
      <PageHeader
        title="Facturas de proveedores"
        subtitle="Compras y gastos de la actividad sanitaria Centroveo."
        action={<ActionLink href="/centroveo/proveedores/nueva">+ Nueva factura de proveedor</ActionLink>}
      />

      <div className="mb-4">
        <Link href="/centroveo" className="text-[13px] text-[var(--brand-teal-dark)] hover:underline">← Volver a Centroveo</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Base sin IVA" value={euro(neto)} tone="sky" sub={`${gastos.length} factura(s)`} />
        <StatCard label="IVA soportado" value={euro(iva)} tone="indigo" />
        <StatCard label="Total" value={euro(total)} />
        <StatCard label="Pagado" value={euro(pagado)} tone="green" sub={`Pendiente: ${euro(total - pagado)}`} />
      </div>

      <Panel title={`Listado (${gastos.length})`}>
        {gastos.length === 0 ? (
          <Empty>Aún no hay facturas de proveedores. Usa «+ Nueva factura de proveedor» para registrar la primera.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Concepto</th>
                  <th>Fecha</th>
                  <th className="text-right">Sin IVA</th>
                  <th className="text-right">IVA</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id}>
                    <td className="font-medium whitespace-nowrap">{g.proveedor}</td>
                    <td className="muted text-[13px] max-w-[300px]">{g.concepto}</td>
                    <td className="muted whitespace-nowrap">{fecha(g.fecha)}</td>
                    <td className="text-right whitespace-nowrap">{euroExacto(g.neto)}</td>
                    <td className="text-right whitespace-nowrap muted">{euroExacto(g.iva)}</td>
                    <td className="text-right font-semibold whitespace-nowrap">{euroExacto(g.importe)}</td>
                    <td>
                      <Badge variant={g.estado === "PAGADO" ? "green" : "amber"}>
                        {g.estado === "PAGADO" ? "Pagado" : "Pendiente"}
                      </Badge>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <CentroveoToggle id={g.id} marcado={g.estado === "PAGADO"} esGasto />
                      <div className="mt-1 text-right">
                        <CentroveoBorrar id={g.id} numero={`la factura de ${g.proveedor}`} esGasto />
                      </div>
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
