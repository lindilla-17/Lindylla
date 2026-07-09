"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apuntarTrabajo, eliminarTrabajo, facturarMes } from "@/app/centroveo/actions";

const TIPOS: { tipo: "CONSULTA" | "CATARATA" | "REFRACTIVA"; label: string; corto: string }[] = [
  { tipo: "CONSULTA", label: "Consulta", corto: "Consultas" },
  { tipo: "CATARATA", label: "Cirugía de cataratas", corto: "Cataratas" },
  { tipo: "REFRACTIVA", label: "Cirugía refractiva", corto: "Refractivas" },
];

// Formulario para apuntar trabajo en el día seleccionado.
// Pensado para usarse cómodo también desde el móvil (botones grandes).
export function ApuntarTrabajoForm({ fecha }: { fecha: string }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"CONSULTA" | "CATARATA" | "REFRACTIVA">("CONSULTA");
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const r = await apuntarTrabajo({ fecha, tipo, cantidad, notas });
    setEnviando(false);
    if (!r.ok) return setError(r.error);
    setCantidad(1);
    setNotas("");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      {/* Tipo de trabajo: botones grandes */}
      <div className="flex flex-col gap-2">
        {TIPOS.map((t) => (
          <button
            type="button"
            key={t.tipo}
            onClick={() => setTipo(t.tipo)}
            className={`text-left px-4 py-2.5 rounded-xl border text-[14px] font-medium transition-colors ${
              tipo === t.tipo
                ? "bg-[var(--accent-soft)] border-[rgba(78,143,132,.45)] text-[var(--brand-teal-dark)]"
                : "border-[var(--border)] muted hover:bg-[var(--surface-2)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cantidad con +/- (cómodo en móvil) */}
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
