"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { convertirPresupuestoEnFactura } from "@/app/facturas/actions";

// Convierte el presupuesto en una factura real de la serie de facturas.
export function ConvertirEnFacturaBtn({ presupuestoId }: { presupuestoId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const convertir = () => {
    const ok = window.confirm(
      "¿Generar la factura? Se creará con el siguiente número de la serie de facturas y no se puede deshacer (habría que rectificarla después)."
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const r = await convertirPresupuestoEnFactura(presupuestoId);
      if (r.ok) router.push(`/facturas/${r.id}/imprimir`);
      else setError(r.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={convertir}
        disabled={pending}
        className="rounded-xl bg-[var(--brand-teal-dark)] text-white font-semibold px-5 py-2.5 text-[14px] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Generando…" : "✓ Aceptado → Generar factura"}
      </button>
      {error && <span className="text-[12px] text-[var(--tone-rose)]">{error}</span>}
    </div>
  );
}
