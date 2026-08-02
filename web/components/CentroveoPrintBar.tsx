"use client";

import Link from "next/link";

// Barra superior de la vista de impresión de facturas de Centroveo (se oculta al imprimir).
export function CentroveoPrintBar({
  volverA,
  enlaceExtra,
}: {
  volverA: string;
  enlaceExtra?: { href: string; label: string };
}) {
  return (
    <div className="no-print mb-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href={volverA} className="text-[13px] font-semibold text-[var(--brand-teal-dark)] hover:underline">
          ← Volver
        </Link>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto rounded-xl bg-[var(--brand-teal)] text-white font-semibold px-5 py-3 sm:py-2.5 text-[15px] sm:text-[14px] hover:bg-[var(--brand-teal-dark)] transition-colors"
        >
          🖨 Imprimir / Guardar PDF
        </button>
      </div>
      {enlaceExtra && (
        <Link href={enlaceExtra.href} className="block mt-2 text-[13px] muted hover:text-[var(--text)] hover:underline">
          📋 {enlaceExtra.label} →
        </Link>
      )}
      <p className="muted-2 text-[12px] mt-2 sm:hidden">
        En el cuadro que se abra, elige <b>&quot;Guardar como PDF&quot;</b> como impresora para descargarla.
      </p>
    </div>
  );
}
