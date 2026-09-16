"use client";

import { useTransition } from "react";
import { eliminarPresupuesto } from "@/app/presupuestos/actions";

// Botón de borrado con confirmación previa (para presupuestos hechos por error).
export function BorrarPresupuestoBtn({ id, cliente }: { id: string; cliente: string }) {
  const [pending, startTransition] = useTransition();

  const borrar = () => {
    const ok = window.confirm(`¿Eliminar este presupuesto de ${cliente} definitivamente?`);
    if (ok) startTransition(() => eliminarPresupuesto(id));
  };

  return (
    <button
      onClick={borrar}
      disabled={pending}
      className="text-[13px] text-[var(--tone-rose)] hover:underline disabled:opacity-50"
      title="Eliminar presupuesto"
    >
      {pending ? "…" : "Eliminar"}
    </button>
  );
}
