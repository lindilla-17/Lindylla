"use client";

import { useTransition } from "react";
import { toggleFacturaPagada } from "@/app/facturas/actions";

// Botón que marca una factura como pagada / pendiente.
export function PagadaToggle({ id, pagada }: { id: string; pagada: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleFacturaPagada(id))}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold border transition-colors disabled:opacity-50 ${
        pagada
          ? "bg-[rgba(78,143,132,.13)] border-[rgba(78,143,132,.3)] text-[var(--tone-green)] hover:bg-[rgba(161,98,7,.1)] hover:border-[rgba(161,98,7,.25)] hover:text-[var(--tone-amber)]"
          : "bg-[rgba(161,98,7,.1)] border-[rgba(161,98,7,.25)] text-[var(--tone-amber)] hover:bg-[rgba(78,143,132,.13)] hover:border-[rgba(78,143,132,.3)] hover:text-[var(--tone-green)]"
      }`}
      title={pagada ? "Marcar como pendiente" : "Marcar como pagada"}
    >
      {pending ? "…" : pagada ? "✓ Pagada" : "Marcar pagada"}
    </button>
  );
}
