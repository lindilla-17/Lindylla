"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apuntarTrabajo, eliminarTrabajo, facturarMes } from "@/app/centroveo/actions";

type Actividad = { id: string; nombre: string; color: string; facturable: boolean; marcaDia: boolean };

// Formulario para apuntar trabajo en el día seleccionado.
// Las actividades vienen de la base de datos (nombre y color elegidos por la usuaria).
// Pensado para usarse cómodo también desde el móvil (botones grandes).
export function ApuntarTrabajoForm({ fecha, actividades }: { fecha: string; actividades: Actividad[] }) {
  const router = useRouter();
  const [actividadId, setActividadId] = useState(actividades[0]?.id ?? "");
  const seleccionada = actividades.find((a) => a.id === actividadId);
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (actividades.length === 0) {
    return (
      <p className="muted text-[14px]">
        No hay actividades activas.{" "}
        <a href="/centroveo/actividades" className="text-[var(--brand-teal-dark)] hover:underline">Crea o activa alguna aquí</a>.
      </p>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const r = await apuntarTrabajo({ fecha, actividadId, cantidad, notas });
    setEnviando(false);
    if (!r.ok) return setError(r.error);
    setCantidad(1);
    setNotas("");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      {/* Actividad: botones grandes con su color */}
      <div className="flex flex-col gap-2">
        {actividades.map((a) => {
          const sel = actividadId === a.id;
          return (
            <button
              type="button"
              key={a.id}
              onClick={() => setActividadId(a.id)}
              className={`flex items-center gap-2.5 text-left px-4 py-2.5 rounded-xl border text-[14px] font-medium transition-colors ${
                sel ? "text-white" : "border-[var(--border)] muted hover:bg-[var(--surface-2)]"
              }`}
              style={sel ? { background: a.color, borderColor: a.color } : { borderColor: undefined }}
            >
              <span className="w-3.5 h-3.5 rounded-full flex-none border border-white/40" style={{ background: sel ? "rgba(255,255,255,.9)" : a.color }} />
              <span className="flex-1">{a.nombre}</span>
              {a.marcaDia ? (
                <span className={`text-[11px] ${sel ? "text-white/80" : "muted-2"}`}>día completo</span>
              ) : !a.facturable ? (
                <span className={`text-[11px] ${sel ? "text-white/80" : "muted-2"}`}>no facturable</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Cantidad con +/- (solo si la actividad lleva número; los días completos no) */}
      {!seleccionada?.marcaDia && (
        <div className="flex items-center gap-3">
          <span className="muted text-[13px] font-medium">Cantidad</span>
          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              className="w-10 h-10 rounded-lg border border-[var(--border)] text-[20px] leading-none muted hover:bg-[var(--surface-2)]">−</button>
            <input
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
              inputMode="numeric"
              className="w-16 h-10 text-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[16px] font-semibold outline-none focus:border-[var(--brand-teal-dark)]"
            />
            <button type="button" onClick={() => setCantidad((c) => c + 1)}
              className="w-10 h-10 rounded-lg border border-[var(--border)] text-[20px] leading-none muted hover:bg-[var(--surface-2)]">+</button>
          </div>
        </div>
      )}

      <input
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Nota (opcional)"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]"
      />

      {error && <div className="text-[13px] text-[var(--tone-rose)]">{error}</div>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-xl bg-[var(--brand-teal-dark)] text-white px-4 py-3 text-[15px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enviando ? "Guardando..." : "Apuntar en este día"}
      </button>
    </form>
  );
}

// Botón para borrar un apunte no facturado
export function BorrarTrabajoBtn({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() => startTransition(async () => { await eliminarTrabajo(id); router.refresh(); })}
      disabled={pending}
      className="text-[12px] text-[var(--tone-rose)] hover:underline disabled:opacity-50"
      title="Borrar apunte"
    >
      {pending ? "..." : "Borrar"}
    </button>
  );
}

// Botón para generar la factura profesional del mes
export function FacturarMesBtn({ mes, deshabilitado }: { mes: string; deshabilitado?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await facturarMes(mes);
            if (!r.ok) return setError(r.error);
            router.push("/centroveo/profesionales");
          })
        }
        disabled={pending || deshabilitado}
        className="rounded-lg bg-[var(--brand-teal-dark)] text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {pending ? "Generando..." : "Generar factura de este mes"}
      </button>
      {error && <div className="text-[12px] text-[var(--tone-rose)] max-w-[280px] text-right">{error}</div>}
    </div>
  );
}
