import { prisma } from "@/lib/prisma";
import { euro } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

type FacturaMin = { total: number; fecha: Date };

export default async function EmpresasPage() {
  const [matrices, totalEmpresas, totalDelegaciones] = await Promise.all([
    prisma.empresa.findMany({
      where: { parentId: null },
      include: {
        facturas: { select: { total: true, fecha: true } },
        hijos: { include: { facturas: { select: { total: true, fecha: true } } } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.empresa.count(),
    prisma.empresa.count({ where: { tipo: "DELEGACION" } }),
  ]);

  const sum = (fs: FacturaMin[]) => fs.reduce((s, f) => s + f.total, 0);
  const porAno = (fs: FacturaMin[]) => {
    const m = new Map<number, number>();
    for (const f of fs) {
      const y = f.fecha.getFullYear();
      m.set(y, (m.get(y) ?? 0) + f.total);
    }
    return [...m.entries()].sort((a, b) => b[0] - a[0]);
  };

  // Ordenar empresas por facturación total (mayor a menor)
  const ordenadas = [...matrices].sort((a, b) => {
    const fa = sum(a.facturas) + a.hijos.reduce((s, h) => s + sum(h.facturas), 0);
    const fb = sum(b.facturas) + b.hijos.reduce((s, h) => s + sum(h.facturas), 0);
    return fb - fa;
  });

  return (
    <Page>
      <PageHeader
        title="Empresas"
        subtitle="Directorio de clientes B2B ordenado por facturación. Las cuentas matriz agrupan a sus delegaciones por país."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Cuentas totales" value={String(totalEmpresas)} />
        <StatCard label="Cuentas matriz" value={String(ordenadas.length)} tone="indigo" />
        <StatCard label="Delegaciones" value={String(totalDelegaciones)} tone="sky" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {ordenadas.map((m) => {
          const todas: FacturaMin[] = [...m.facturas, ...m.hijos.flatMap((h) => h.facturas)];
          const facturadoTotal = sum(todas);
          const anual = porAno(todas);
          return (
            <Panel key={m.id}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[14px] font-bold text-[var(--brand-pink)]">
                        {m.nombre.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[15px]">{m.nombre}</div>
                        {m.sector && <div className="muted-2 text-[12px]">{m.sector}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] font-semibold text-[var(--tone-green)]">{euro(facturadoTotal)}</div>
                    <div className="muted-2 text-[11px]">facturado histórico</div>
                  </div>
                </div>

                {/* Facturación por años */}
                {anual.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {anual.map(([y, t]) => (
                      <div key={y} className="rounded-lg bg-[var(--surface-2)] border border-[var(--border-soft)] px-3 py-1.5">
                        <span className="muted-2 text-[11px] font-semibold mr-2">{y}</span>
                        <span className="text-[13px] font-semibold">{euro(t)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {m.hijos.length > 0 ? (
                  <div className="mt-4 pl-2 border-l-2 border-[var(--border)] flex flex-col gap-1">
                    {m.hijos
                      .slice()
                      .sort((a, b) => sum(b.facturas) - sum(a.facturas))
                      .map((h) => (
                        <div key={h.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[13px] font-medium truncate">{h.nombre}</span>
                            {h.pais && <Badge variant="slate">{h.pais}</Badge>}
                          </div>
                          <div className="text-right flex-none">
                            <span className="text-[13px] font-semibold muted">{euro(sum(h.facturas))}</span>
                            <span className="muted-2 text-[11px] ml-2">
                              {porAno(h.facturas)
                                .map(([y, t]) => `${y}: ${euro(t)}`)
                                .join(" · ") || "sin facturas"}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="mt-3 muted-2 text-[12px]">
                    {m.pais ? `${m.pais} · ` : ""}Cuenta directa (sin delegaciones)
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </Page>
  );
}
