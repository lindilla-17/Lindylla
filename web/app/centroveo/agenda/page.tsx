import { prisma } from "@/lib/prisma";
import { euro } from "@/lib/format";
import { Page, PageHeader, Panel } from "@/components/ui";
import { asegurarActividades } from "../actions";
import { ApuntarTrabajoForm, BorrarTrabajoBtn, FacturarMesBtn } from "@/components/AgendaTrabajo";
import Link from "next/link";

export const dynamic = "force-dynamic";

const dosDig = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${dosDig(d.getMonth() + 1)}-${dosDig(d.getDate())}`;

// Agenda de trabajo profesional (calendario mensual).
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await asegurarActividades();
  const params = await searchParams;
  const hoy = new Date();

  const [actividades, ] = await Promise.all([
    prisma.centroveoActividad.findMany({ orderBy: { orden: "asc" } }),
  ]);
  const activas = actividades.filter((a) => a.activa);
  const colorDe = (id: string) => actividades.find((a) => a.id === id)?.color ?? "#94a3b8";
  const nombreDe = (id: string) => actividades.find((a) => a.id === id)?.nombre ?? "—";
  const facturableDe = (id: string) => actividades.find((a) => a.id === id)?.facturable ?? false;
  const precioDe = (id: string) => actividades.find((a) => a.id === id)?.precio ?? 0;
  const hayPrecios = actividades.some((a) => a.facturable && a.precio > 0);

  // Mes visible (?mes=YYYY-MM); por defecto el actual
  const mesParam = typeof params.mes === "string" && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : null;
  const [anio, mes] = (mesParam ?? `${hoy.getFullYear()}-${dosDig(hoy.getMonth() + 1)}`).split("-").map(Number);
  const mesStr = `${anio}-${dosDig(mes)}`;
  const primero = new Date(anio, mes - 1, 1);
  const finMes = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes, 0).getDate();

  // Día seleccionado (?dia=YYYY-MM-DD); por defecto hoy si estamos en el mes en curso, si no el día 1
  const diaParam = typeof params.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.dia) ? params.dia : null;
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;
  const diaSel = diaParam ?? (esMesActual ? ymd(hoy) : `${mesStr}-01`);

  // Trabajo del mes
  const trabajos = await prisma.centroveoTrabajo.findMany({
    where: { fecha: { gte: primero, lt: finMes } },
    orderBy: { createdAt: "asc" },
  });

  // Índice por día y por actividad
  const porDia: Record<string, Record<string, number>> = {};
  for (const t of trabajos) {
    const k = ymd(t.fecha);
    (porDia[k] ??= {})[t.actividadId] = (porDia[k]?.[t.actividadId] ?? 0) + t.cantidad;
  }

  // Totales del mes por actividad (solo lo pendiente cuenta para el importe facturable)
  const totMes: Record<string, number> = {};
  const totPend: Record<string, number> = {};
  for (const t of trabajos) {
    totMes[t.actividadId] = (totMes[t.actividadId] ?? 0) + t.cantidad;
    if (!t.facturaId) totPend[t.actividadId] = (totPend[t.actividadId] ?? 0) + t.cantidad;
  }
  // Actividades a mostrar en el resumen: las que tienen trabajo este mes + las activas
  const idsResumen = [...new Set([...actividades.filter((a) => a.activa).map((a) => a.id), ...Object.keys(totMes)])];
  const importePend = Object.entries(totPend).reduce(
    (s, [id, uds]) => s + (facturableDe(id) ? uds * precioDe(id) : 0), 0
  );
  const hayPendienteFacturable = Object.entries(totPend).some(([id, uds]) => facturableDe(id) && uds > 0);

  // Rejilla del calendario (lunes primero)
  const offset = (primero.getDay() + 6) % 7;
  const celdas: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const prevMes = mes === 1 ? `${anio - 1}-12` : `${anio}-${dosDig(mes - 1)}`;
  const nextMes = mes === 12 ? `${anio + 1}-01` : `${anio}-${dosDig(mes + 1)}`;
  const nombreMes = primero.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const delDia = trabajos.filter((t) => ymd(t.fecha) === diaSel);
  const fechaSelLarga = new Date(`${diaSel}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <Page>
      <PageHeader
        title="Agenda de trabajo"
        subtitle="Apunta tu trabajo diario. Cada mes lo conviertes en una factura de trabajos profesionales."
      />

      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <Link href="/centroveo" className="text-[13px] text-[var(--brand-teal-dark)] hover:underline">← Volver a Centroveo</Link>
        <Link href="/centroveo/actividades" className="text-[13px] muted hover:text-[var(--text)] hover:underline">
          ⚙ Actividades y precios
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* Calendario */}
        <Panel
          title={nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}
          right={
            <div className="flex items-center gap-1">
              <Link href={`/centroveo/agenda?mes=${prevMes}`} className="px-2.5 py-1 rounded-lg border border-[var(--border)] muted hover:bg-[var(--surface-2)] text-[14px]">←</Link>
              <Link href="/centroveo/agenda" className="px-3 py-1 rounded-lg border border-[var(--border)] muted hover:bg-[var(--surface-2)] text-[12px]">Hoy</Link>
              <Link href={`/centroveo/agenda?mes=${nextMes}`} className="px-2.5 py-1 rounded-lg border border-[var(--border)] muted hover:bg-[var(--surface-2)] text-[14px]">→</Link>
            </div>
          }
        >
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
              {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                <div key={i} className="text-center muted-2 text-[11px] font-semibold py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {celdas.map((dia, i) => {
                if (dia === null) return <div key={i} />;
                const clave = `${mesStr}-${dosDig(dia)}`;
                const trabajoDia = porDia[clave];
                const esHoy = clave === ymd(hoy);
                const seleccionado = clave === diaSel;
                return (
                  <Link
                    key={i}
                    href={`/centroveo/agenda?mes=${mesStr}&dia=${clave}`}
                    className={`min-h-[54px] sm:min-h-[64px] rounded-lg border p-1.5 flex flex-col gap-1 transition-colors ${
                      seleccionado
                        ? "border-[var(--brand-teal-dark)] bg-[var(--accent-soft)]"
                        : "border-[var(--border-soft)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <span className={`text-[12px] font-semibold ${esHoy ? "text-[var(--brand-teal-dark)]" : "muted"}`}>
                      {dia}{esHoy && " ·"}
                    </span>
                    {trabajoDia && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {Object.entries(trabajoDia).map(([id, uds]) => (
                          <span key={id} className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[11px] font-bold text-white"
                            style={{ background: colorDe(id) }} title={nombreDe(id)}>
                            {uds}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
            {/* Leyenda */}
            {activas.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-[var(--border-soft)]">
                {activas.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1.5 text-[12px] muted">
                    <span className="w-3 h-3 rounded" style={{ background: a.color }} /> {a.nombre}
                    {!a.facturable && <span className="muted-2">(no facturable)</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {/* Panel del día + resumen del mes */}
        <div className="flex flex-col gap-5">
          <Panel title={fechaSelLarga.charAt(0).toUpperCase() + fechaSelLarga.slice(1)}>
            <div className="p-4 flex flex-col gap-4">
              <ApuntarTrabajoForm
                fecha={diaSel}
                actividades={activas.map((a) => ({ id: a.id, nombre: a.nombre, color: a.color, facturable: a.facturable }))}
              />

              {delDia.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-soft)]">
                  <div className="muted-2 text-[12px] font-semibold uppercase tracking-wide">Apuntado este día</div>
                  {delDia.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded text-[12px] font-bold text-white flex-none" style={{ background: colorDe(t.actividadId) }}>{t.cantidad}</span>
                        <div className="min-w-0">
                          <div className="text-[14px] truncate">{nombreDe(t.actividadId)}</div>
                          {t.notas && <div className="muted-2 text-[11px] truncate">{t.notas}</div>}
                        </div>
                      </div>
                      {t.facturaId ? (
                        <span className="text-[11px] muted-2 flex-none">facturado</span>
                      ) : (
                        <BorrarTrabajoBtn id={t.id} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          {/* Resumen del mes → factura profesional */}
          <Panel title="Resumen del mes">
            <div className="p-4 flex flex-col gap-3">
              {idsResumen.length === 0 ? (
                <p className="muted text-[13px]">Sin actividades. <Link href="/centroveo/actividades" className="text-[var(--brand-teal-dark)] hover:underline">Crea alguna</Link>.</p>
              ) : (
                idsResumen.map((id) => (
                  <div key={id} className="flex items-center justify-between text-[14px]">
                    <span className="muted flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorDe(id) }} />
                      {nombreDe(id)}
                    </span>
                    <span className="font-medium">
                      {totMes[id] ?? 0}
                      {facturableDe(id) && precioDe(id) > 0 && (
                        <span className="muted-2 text-[12px]"> · {euro((totPend[id] ?? 0) * precioDe(id))}</span>
                      )}
                      {!facturableDe(id) && <span className="muted-2 text-[12px]"> · no factura</span>}
                    </span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-soft)]">
                <span className="text-[14px] font-semibold">Pendiente de facturar</span>
                <span className="text-[18px] font-semibold text-[var(--brand-teal-dark)]">
                  {hayPrecios ? euro(importePend) : "—"}
                </span>
              </div>

              {!hayPrecios ? (
                <p className="muted-2 text-[12px]">
                  Aún no hay precios. <Link href="/centroveo/actividades" className="text-[var(--brand-teal-dark)] hover:underline">Ponlos en Actividades</Link> y el importe se calculará solo.
                </p>
              ) : hayPendienteFacturable ? (
                <div className="pt-1">
                  <FacturarMesBtn mes={mesStr} />
                  <p className="muted-2 text-[11px] mt-2">
                    Crea una factura profesional (exenta de IVA) al Hospital Vithas Xanit con el trabajo facturable pendiente de este mes.
                  </p>
                </div>
              ) : (
                <p className="muted-2 text-[12px]">No hay trabajo facturable pendiente este mes.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
