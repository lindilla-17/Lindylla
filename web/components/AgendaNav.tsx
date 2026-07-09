"use client";

import { useRouter } from "next/navigation";

// Navegación de meses de la agenda: flechas de mes, salto de año,
// selector directo de mes (para programar citas futuras) y botón "Hoy".
export function AgendaNav({ mes }: { mes: string }) {
  const router = useRouter();
  const [y, m] = mes.split("-").map(Number);
  const dos = (n: number) => String(n).padStart(2, "0");

  const irA = (yy: number, mm: number) => router.push(`/centroveo/agenda?mes=${yy}-${dos(mm)}`);
  const desplazar = (meses: number) => {
    const d = new Date(y, m - 1 + meses, 1);
    irA(d.getFullYear(), d.getMonth() + 1);
  };

  const btn = "h-9 px-2.5 rounded-lg border border-[var(--border)] muted hover:bg-[var(--surface-2)] hover:text-[var(--text)] text-[15px] leading-none flex items-center";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={() => desplazar(-12)} title="Año anterior" className={btn}>«</button>
      <button onClick={() => desplazar(-1)} title="Mes anterior" className={btn}>‹</button>

      {/* Selector directo de mes (nativo, cómodo en móvil) */}
      <input
        type="month"
        value={mes}
        onChange={(e) => { if (/^\d{4}-\d{2}$/.test(e.target.value)) router.push(`/centroveo/agenda?mes=${e.target.value}`); }}
        className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] outline-none focus:border-[var(--brand-teal-dark)]"
        title="Ir a un mes concreto"
      />

      <button onClick={() => desplazar(1)} title="Mes siguiente" className={btn}>›</button>
      <button onClick={() => desplazar(12)} title="Año siguiente" className={btn}>»</button>
      <button onClick={() => router.push("/centroveo/agenda")} className="h-9 px-3 rounded-lg border border-[var(--border)] muted hover:bg-[var(--surface-2)] hover:text-[var(--text)] text-[12px] font-medium">Hoy</button>
    </div>
  );
}
