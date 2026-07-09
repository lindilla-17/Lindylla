"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarTarifas } from "@/app/centroveo/actions";
import { TRABAJOS } from "@/app/centroveo/trabajos";

// Editor de los precios por tipo de trabajo profesional.
export function TarifasForm({ inicial }: { inicial: { tipo: string; precio: number }[] }) {
  const router = useRouter();
  const [precios, setPrecios] = useState<Record<string, string>>(
    Object.fromEntries(inicial.map((t) => [t.tipo, t.precio ? String(t.precio).replace(".", ",") : ""]))
  );
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setGuardado(false);
    await guardarTarifas(
      Object.keys(TRABAJOS).map((tipo) => ({ tipo, precio: parseFloat((precios[tipo] || "0").replace(",", ".")) || 0 }))
    );
    setEnviando(false);
    setGuardado(true);
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="card p-6 max-w-[460px] flex flex-col gap-4">
      {(Object.keys(TRABAJOS) as (keyof typeof TRABAJOS)[]).map((tipo) => (
        <div key={tipo} className="flex items-center justify-between gap-4">
          <label className="text-[14px] font-medium">{TRABAJOS[tipo]}</label>
          <div className="flex items-center gap-2">
            <input
              value={precios[tipo] ?? ""}
              onChange={(e) => { setPrecios((p) => ({ ...p, [tipo]: e.target.value })); setGuardado(false); }}
              placeholder="0,00"
              inputMode="decimal"
              className="w-28 text-right rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]"
            />
            <span className="muted text-[14px]">€ / ud.</span>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 mt-1">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-[var(--brand-teal-dark)] text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Guardar precios"}
        </button>
        {guardado && <span className="text-[13px] text-[var(--tone-green)]">✓ Guardado</span>}
      </div>
      <p className="muted-2 text-[12px]">
        Estos precios se usan para calcular el importe del trabajo de cada mes en la agenda.
        No afectan a las facturas ya generadas.
      </p>
    </form>
  );
}
