"use client";

import { useState, useTransition } from "react";

// Campo para poner o corregir el código/nº de pedido que da el cliente — a
// veces lo dan al pedir el presupuesto, a veces solo al facturar, así que se
// puede editar en cualquier momento sin tocar el resto del documento.
export function CodigoPedidoEditable({
  id,
  valorInicial,
  accion,
}: {
  id: string;
  valorInicial: string | null;
  accion: (id: string, codigo: string) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorInicial ?? "");
  const [pending, startTransition] = useTransition();

  const guardar = () => {
    startTransition(async () => {
      await accion(id, valor);
      setEditando(false);
    });
  };

  if (editando) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--brand-teal-dark)]"
          placeholder="Código de pedido del cliente"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
        />
        <button
          onClick={guardar}
          disabled={pending}
          className="text-[12px] font-semibold text-[var(--brand-teal-dark)] hover:underline disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button onClick={() => setEditando(false)} className="text-[12px] muted hover:underline">
          Cancelar
        </button>
      </div>
    );
  }

  return valorInicial ? (
    <button onClick={() => setEditando(true)} className="text-[13px] muted hover:text-[var(--text)]" title="Cambiar código de pedido">
      Nº pedido: <span className="font-semibold text-[var(--text)]">{valorInicial}</span>
    </button>
  ) : (
    <button onClick={() => setEditando(true)} className="text-[13px] text-[var(--brand-teal-dark)] hover:underline">
      + Añadir código de pedido
    </button>
  );
}
