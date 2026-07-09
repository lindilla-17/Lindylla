"use client";

import { useTransition } from "react";
import { eliminarFactura } from "@/app/facturas/actions";

// Botón de borrado con confirmación previa.
export function BorrarFacturaBtn({ id, numero }: { id: string; numero: string }) {
  const [pending, startTransition] = useTransition();

  const borrar = () => {
    const ok = window.confirm(
      `¿Eliminar la factura ${numero} definitivamente?\n\nSolo hazlo con pruebas o errores recién creados. Una factura ya enviada al cliente no se borra: se rectifica.`
    );
    if (ok) startTransition(() => eliminarFactura(id));
  };

  return (
    <button
      onClick={borrar}
      disabled={pending}
      className="text-[var(--tone-rose)] hover:underline disabled:opacity-50"
      title="Eliminar factura"
    >
      {pending ? "…" : "Eliminar"}
    </button>
  );
}
