import { prisma } from "@/lib/prisma";
import { euro, euroExacto, fecha } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge, ActionLink, Empty } from "@/components/ui";
import { CentroveoToggle, CentroveoBorrar } from "@/components/CentroveoControles";
import Link from "next/link";

// Listado compartido de facturas emitidas de Centroveo, filtrado por tipo.
// Lo usan /centroveo/emitidas (LENTES) y /centroveo/profesionales (PROFESIONAL).
export async function ListaFacturasCentroveo({
  tipo,
  titulo,
  subtitulo,
  etiquetaIva,
}: {
  tipo: "LENTES" | "PROFESIONAL";
  titulo: string;
  subtitulo: string;
  etiquetaIva: string;
}) {
  const facturas = await prisma.centroveoFactura.findMany({
    where: { tipo },
    orderBy: { fecha: "desc" },
  });

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

      <div className="mb-4">
        <Link href="/centroveo" className="text-[13px] text-[var(--brand-teal-dark)] hover:underline">← Volver a Centroveo</Link>
      </div>

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
          <div className="overflow-x-auto">
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
                  <th></th>
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
                    <td className="text-right whitespace-nowrap">
                      <CentroveoToggle id={f.id} marcado={f.estado === "PAGADA"} />
                      <div className="mt-1 text-right">
                        <CentroveoBorrar id={f.id} numero={f.numero} />
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
