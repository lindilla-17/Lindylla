"use client";

import Link from "next/link";

// Barra superior de la vista de impresión de facturas de Centroveo (se oculta al imprimir).
export function CentroveoPrintBar({ volverA }: { volverA: string }) {
  return (
    <div className="no-print flex items-center justify-between mb-5">
      <Link href={volverA} className="text-[13px] font-semibold text-[var(--brand-teal-dark)] hover:underline">
        ← Volver
      </Link>
      <button
        onClick={() => window.print()}
        className="rounded-xl bg-[var(--brand-teal)] text-white font-semibold px-5 py-2.5 text-[14px] hover:bg-[var(--brand-teal-dark)] transition-colors"
      >
        🖨 Imprimir / Guardar PDF
      </button>
    </div>
  );
}
