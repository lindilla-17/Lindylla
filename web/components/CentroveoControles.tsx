"use client";

import { useTransition } from "react";
import {
  toggleCentroveoFacturaPagada,
  eliminarCentroveoFactura,
  toggleCentroveoGastoPagado,
  eliminarCentroveoGasto,
} from "@/app/centroveo/actions";

// Botón que alterna el estado de cobro/pago de un documento de Centroveo
export function CentroveoToggle({ id, marcado, esGasto }: { id: string; marcado: boolean; esGasto?: boolean }) {
  const [pending, startTransition] = useTransition();
  const accion = esGasto ? toggleCentroveoGastoPagado : toggleCentroveoFacturaPagada;
  const etiqueta = esGasto
    ? marcado ? "Marcar pendiente" : "Marcar pagado"
    : marcado ? "Marcar pendiente" : "Marcar cobrada";
  return (
    <button
      onClick={() => startTransition(() => accion(id))}
      disabled={pending}
      className="text-[12px] px-2.5 py-1 rounded-lg border border-[var(--border)] muted hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
    >
      {pending ? "..." : etiqueta}
    </button>
  );
}

// Botón de borrado con confirmación (para errores recién creados)
export function CentroveoBorrar({ id, numero, esGasto }: { id: string; numero: string; esGasto?: boolean }) {
  const [pending, startTransition] = useTransition();
  const accion = esGasto ? eliminarCentroveoGasto : eliminarCentroveoFactura;
  return (
    <button
      onClick={() => {
        if (confirm(`¿Borrar ${numero} definitivamente?\n\nSolo para errores recién creados. Si ya se envió o declaró, no la borres: emite una rectificativa.`)) {
          startTransition(() => accion(id));
        }
      }}
      disabled={pending}
      className="text-[12px] text-[var(--tone-rose)] hover:underline disabled:opacity-50"
    >
      Borrar
    </button>
  );
}
