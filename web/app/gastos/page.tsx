import { prisma } from "@/lib/prisma";
import { euro, euroExacto, fecha } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge, ActionLink, Empty } from "@/components/ui";
import { GastoToggle, GastoBorrar } from "@/components/GastoControles";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Gastos de Lindilla (gorros): materiales, personal, logística, congresos...
export default async function GastosPage() {
  const gastos = await prisma.gasto.findMany({ orderBy: { fecha: "desc" } });

  const neto = gastos.reduce((s, g) => s + g.neto, 0);
  const iva = gastos.reduce((s, g) => s + g.iva, 0);
  const total = gastos.reduce((s, g) => s + g.importe, 0);
  const pagado = gastos.filter((g) => g.estado === "PAGADO").reduce((s, g) => s + g.importe, 0);

  return (
    <Page>
      <PageHeader
        title="Gastos"
        subtitle="Gastos de Lindilla (gorros): material, personal, logística, congresos..."
        action={<ActionLink href="/gastos/nueva">+ Nuevo gasto</ActionLink>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Base sin IVA" value={euro(neto)} tone="sky" sub={`${gastos.length} gasto(s)`} />
        <StatCard label="IVA soportado" value={euro(iva)} tone="indigo" />
        <StatCard label="Total" value={euro(total)} />
        <StatCard label="Pagado" value={euro(pagado)} tone="green" sub={`Pendiente: ${euro(total - pagado)}`} />
      </div>

      <Panel title={`Listado (${gastos.length})`}>
        {gastos.length === 0 ? (
          <Empty>Aún no hay gastos registrados. Usa «+ Nuevo gasto» para dar de alta el primero.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Fecha</th>
                  <th className="text-right">Sin IVA</th>
                  <th className="text-right">IVA</th>
                  <th className="text-right">Total</th>
                  <th>Justificante</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id}>
                    <td className="font-medium whitespace-nowrap">{g.proveedor ?? "—"}</td>
                    <td className="muted text-[13px] max-w-[300px]">{g.concepto}</td>
                    <td className="muted text-[13px] whitespace-nowrap">
                      {g.categoria}
                      {g.tipo === "MIOS" && <span className="ml-1 text-[11px] muted-2">· mío</span>}
                    </td>
                    <td className="muted whitespace-nowrap">{fecha(g.fecha)}</td>
                    <td className="text-right whitespace-nowrap">{euroExacto(g.neto)}</td>
                    <td className="text-right whitespace-nowrap muted">{euroExacto(g.iva)}</td>
                    <td className="text-right font-semibold whitespace-nowrap">{euroExacto(g.importe)}</td>
                    <td className="text-[12px]">
                      {g.archivo ? (
                        <span className="text-[var(--tone-green)]">✓ {g.archivo}</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {g.notas && (
                            <span className="text-[var(--tone-rose)]" title={g.notas}>⚠ No subida</span>
                          )}
                          <Link href={`/gastos/${g.id}/foto`} className="text-[var(--brand-teal-dark)] hover:underline">
                            + Subir foto
                          </Link>
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant={g.estado === "PAGADO" ? "green" : "amber"}>
                        {g.estado === "PAGADO" ? "Pagado" : "Pendiente"}
                      </Badge>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <GastoToggle id={g.id} pagado={g.estado === "PAGADO"} />
                      <div className="mt-1 text-right">
                        <GastoBorrar id={g.id} etiqueta={g.proveedor ?? g.concepto} />
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
