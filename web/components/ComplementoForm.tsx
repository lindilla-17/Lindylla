"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarComplemento } from "@/app/centroveo/actions";

// Editor del complemento fijo que se suma a cada factura mensual (ej. autónomos)
export function ComplementoForm({ inicial }: { inicial: { importe: number; concepto: string } }) {
  const router = useRouter();
  const [importe, setImporte] = useState(inicial.importe ? String(inicial.importe).replace(".", ",") : "");
  const [concepto, setConcepto] = useState(inicial.concepto);
  const [guardado, setGuardado] = useState(false);
  const [busy, setBusy] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setGuardado(false);
    await guardarComplemento({ importe: parseFloat(importe.replace(",", ".")) || 0, concepto });
    setBusy(false); setGuardado(true);
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="card p-5 max-w-[560px] flex flex-col gap-3">
      <div>
        <div className="font-semibold text-[15px]">Complemento mensual fijo</div>
        <p className="muted text-[13px] mt-1">Se suma automáticamente a cada factura de trabajos profesionales del mes (además del trabajo apuntado).</p>
      </div>
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Concepto</label>
          <input value={concepto} onChange={(e) => { setConcepto(e.target.value); setGuardado(false); }} placeholder="Ej.: Cuota de autónomos"
            className="w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]" />
        </div>
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Importe</label>
          <div className="flex items-center gap-2">
            <input value={importe} onChange={(e) => { setImporte(e.target.value); setGuardado(false); }} placeholder="0,00" inputMode="decimal"
              className="w-28 text-right rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]" />
            <span className="muted text-[14px]">€ / mes</span>
          </div>
        </div>
        <button type="submit" disabled={busy}
          className="rounded-lg bg-[var(--brand-teal-dark)] text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 disabled:opacity-50">
          {busy ? "..." : "Guardar"}
        </button>
        {guardado && <span className="text-[13px] text-[var(--tone-green)]">✓ Guardado</span>}
      </div>
      <p className="muted-2 text-[12px]">Pon el importe a 0 si algún mes no quieres que se añada.</p>
    </form>
  );
}
