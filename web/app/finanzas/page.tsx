import { getResumenAnual, getPendientes } from "@/lib/finanzas";
import { euro, euroExacto, fecha, porcentaje } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge } from "@/components/ui";
import { YearChart } from "@/components/YearChart";

export const dynamic = "force-dynamic";

export default async function FinanzasPage() {
  const [resumen, pendientes] = await Promise.all([getResumenAnual(), getPendientes()]);

  const year = new Date().getFullYear();
  const esteAno = resumen.find((r) => r.year === year);
  const anoAnterior = resumen.find((r) => r.year === year - 1);
  const mejorAno = [...resumen].sort((a, b) => b.rentabilidad - a.rentabilidad)[0];

  const varIngresos =
    esteAno && anoAnterior && anoAnterior.ingresos > 0
      ? (esteAno.ingresos - anoAnterior.ingresos) / anoAnterior.ingresos
      : null;

  return (
    <Page>
      <PageHeader
        title="Finanzas"
        subtitle="Rentabilidad anual sobre la base SIN IVA (el IVA cobrado no es ingreso: se liquida a Hacienda). Solo cuentan las facturas emitidas — los presupuestos sin factura no entran en la contabilidad."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label={`Beneficio ${year}`} value={euro(esteAno?.rentabilidad ?? 0)} tone="green" sub={esteAno ? `Margen ${porcentaje(esteAno.margen)}` : undefined} />
        <StatCard
          label={`Ingresos ${year} (sin IVA)`}
          value={euro(esteAno?.ingresos ?? 0)}
          tone="sky"
          sub={varIngresos !== null ? (
            <span className={varIngresos >= 0 ? "text-[var(--tone-green)]" : "text-[var(--tone-rose)]"}>
              {varIngresos >= 0 ? "▲" : "▼"} {Math.abs(varIngresos * 100).toFixed(0)}% vs {year - 1}
            </span>
          ) : undefined}
        />
        <StatCard label="A recibir (pendiente)" value={euro(pendientes.porCobrar)} tone="amber" sub={`${pendientes.facturasPend.length} factura(s)`} />
        <StatCard label="A pagar (pendiente)" value={euro(pendientes.porPagar)} tone="rose" sub={`${pendientes.gastosPend.length} gasto(s)`} />
      </div>

      {/* Comparativa */}
      <Panel title="Comparativa anual" right={mejorAno && <span className="muted text-[13px]">Mejor año: <b className="text-[var(--tone-green)]">{mejorAno.year}</b></span>} className="mb-5">
        <div className="p-5">
          <YearChart data={resumen} />
        </div>
      </Panel>

      {/* Tabla resumen por año */}
      <Panel title="Detalle por año" className="mb-5">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Año</th>
                <th className="text-right">Ingresos sin IVA</th>
                <th className="text-right">IVA repercutido</th>
                <th className="text-right">Cobrado (con IVA)</th>
                <th className="text-right">Gastos</th>
                <th className="text-right">Beneficio</th>
                <th className="text-right">Margen</th>
              </tr>
            </thead>
            <tbody>
              {[...resumen].reverse().map((r) => (
                <tr key={r.year}>
                  <td className="font-semibold">{r.year}</td>
                  <td className="text-right">{euro(r.ingresos)}</td>
                  <td className="text-right muted">{euro(r.iva)}</td>
                  <td className="text-right muted">{euro(r.cobrado)}</td>
                  <td className="text-right text-[var(--tone-rose)]">{euro(r.gastos)}</td>
                  <td className="text-right font-semibold text-[var(--tone-green)]">{euro(r.rentabilidad)}</td>
                  <td className="text-right">{porcentaje(r.margen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Pendientes: a recibir vs a pagar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel
          title="Ingresos a recibir"
          right={<span className="text-[15px] font-semibold text-[var(--tone-amber)]">{euro(pendientes.porCobrar)}</span>}
        >
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Vencimiento</th>
                  <th className="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.facturasPend.length === 0 ? (
                  <tr><td colSpan={3} className="text-center muted py-8">Todo cobrado 🎉</td></tr>
                ) : (
                  pendientes.facturasPend.map((f) => (
                    <tr key={f.id}>
                      <td className="font-medium">{f.empresa.nombre}<div className="muted-2 text-[12px] font-mono">{f.numero}</div></td>
                      <td className="muted">{fecha(f.fechaVencimiento)}</td>
                      <td className="text-right font-semibold">{euroExacto(f.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Gastos a pagar"
          right={<span className="text-[15px] font-semibold text-[var(--tone-rose)]">{euro(pendientes.porPagar)}</span>}
        >
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Vencimiento</th>
                  <th className="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.gastosPend.length === 0 ? (
                  <tr><td colSpan={3} className="text-center muted py-8">Nada pendiente 🎉</td></tr>
                ) : (
                  pendientes.gastosPend.map((g) => (
                    <tr key={g.id}>
                      <td className="font-medium">{g.concepto}<div className="muted-2 text-[12px]">{g.proveedor ?? ""}</div></td>
                      <td className="muted">{fecha(g.fechaVencimiento)}</td>
                      <td className="text-right font-semibold">{euroExacto(g.importe)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
