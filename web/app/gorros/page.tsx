import { listarGorros, RUTA_FOTOS_GORROS } from "@/lib/gorros";
import { Page, PageHeader, StatCard, Panel, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function GorrosPage() {
  const grupos = listarGorros();
  const totalFotos = grupos.reduce((s, g) => s + g.fotos.length, 0);

  return (
    <Page>
      <PageHeader
        title="Gorros"
        subtitle={`Galería de diseños por cliente, leída directamente de tu carpeta "fotos gorros\\empresa". Añade fotos ahí y aparecerán aquí.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <StatCard label="Diseños / clientes" value={String(grupos.length)} tone="sky" />
        <StatCard label="Fotos" value={String(totalFotos)} tone="green" />
      </div>

      {grupos.length === 0 ? (
        <Panel>
          <Empty>
            No se encontraron fotos en
            <br />
            <span className="font-mono text-[12px]">{RUTA_FOTOS_GORROS}</span>
          </Empty>
        </Panel>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map((g) => (
            <Panel key={g.nombre} title={`${capitalizar(g.nombre)} (${g.fotos.length})`}>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {g.fotos.map((f) => (
                  <a
                    key={f.rel}
                    href={`/api/foto?p=${encodeURIComponent(f.rel)}`}
                    target="_blank"
                    className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--brand-mint)] transition-colors"
                    title={f.nombre}
                  >
                    <div className="aspect-square overflow-hidden bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/foto?p=${encodeURIComponent(f.rel)}`}
                        alt={f.nombre}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="px-2.5 py-2">
                      <div className="text-[12px] font-semibold truncate">{capitalizar(f.nombre)}</div>
                      <div className="text-[11px] muted-2 truncate">{f.archivo}</div>
                    </div>
                  </a>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </Page>
  );
}

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
