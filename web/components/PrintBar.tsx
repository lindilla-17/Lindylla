"use client";

import Link from "next/link";

// Barra superior de la vista de impresión (se oculta al imprimir).
export function PrintBar({
  facturaId,
  volverHref = "/facturas",
  volverLabel = "← Volver a facturas",
  descargarPdfHref,
}: {
  facturaId?: string;
  volverHref?: string;
  volverLabel?: string;
  // Si se pasa, se genera el PDF real en el servidor (sin el pie de página
  // que añade el propio móvil/navegador al imprimir).
  descargarPdfHref?: string;
}) {
  return (
    <div className="no-print flex items-center justify-between mb-5">
      <Link href={volverHref} className="text-[13px] font-semibold text-[var(--brand-teal-dark)] hover:underline">
        {volverLabel}
      </Link>
      <div className="flex items-center gap-3">
        {facturaId && (
          <Link
            href={`/facturas/${facturaId}/editar`}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-[14px] font-semibold muted hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            ✎ Corregir
          </Link>
        )}
        {descargarPdfHref ? (
          <a
            href={descargarPdfHref}
            className="rounded-xl bg-[var(--brand-teal)] text-white font-semibold px-5 py-2.5 text-[14px] hover:bg-[var(--brand-teal-dark)] transition-colors"
          >
            ⬇ Descargar PDF
          </a>
        ) : (
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-[var(--brand-teal)] text-white font-semibold px-5 py-2.5 text-[14px] hover:bg-[var(--brand-teal-dark)] transition-colors"
          >
            🖨 Imprimir / Guardar PDF
          </button>
        )}
      </div>
    </div>
  );
}
