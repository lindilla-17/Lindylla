"use client";

import { useTransition } from "react";
import { toggleGastoPagado, eliminarGasto } from "@/app/gastos/actions";

export function GastoToggle({ id, pagado }: { id: string; pagado: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => toggleGastoPagado(id))}
      disabled={pending}
      className="text-[12px] px-2.5 py-1 rounded-lg border border-[var(--border)] muted hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
    >
      {pending ? "..." : pagado ? "Marcar pendiente" : "Marcar pagado"}
    </button>
  );
}

export function GastoBorrar({ id, etiqueta }: { id: string; etiqueta: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        if (confirm(`¿Borrar el gasto "${etiqueta}" definitivamente?`)) {
          startTransition(() => eliminarGasto(id));
        }
      }}
      disabled={pending}
      className="text-[12px] text-[var(--tone-rose)] hover:underline disabled:opacity-50"
    >
      Borrar
    </button>
  );
}
