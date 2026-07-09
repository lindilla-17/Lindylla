"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearCentroveoGasto } from "@/app/centroveo/actions";

// Formulario de factura de proveedor de Centroveo.
// Aquí el IVA sí se teclea porque cada proveedor factura con su tipo.
export function CentroveoGastoForm() {
  const router = useRouter();
  const [proveedor, setProveedor] = useState("");
  const [concepto, setConcepto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [neto, setNeto] = useState<string>("");
  const [iva, setIva] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const num = (s: string) => parseFloat(s.replace(",", ".")) || 0;
  const total = Math.round((num(neto) + num(iva)) * 100) / 100;
  const eur = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const r = await crearCentroveoGasto({ proveedor, concepto, fecha, neto: num(neto), iva: num(iva) });
    setEnviando(false);
    if (!r.ok) return setError(r.error);
    router.push("/centroveo/proveedores");
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]";

  return (
    <form onSubmit={enviar} className="card p-6 max-w-[620px] flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Proveedor</label>
          <input className={inputCls} value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Ej.: CooperVision" required />
        </div>
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Fecha</label>
          <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="muted text-[13px] font-medium block mb-1.5">Concepto</label>
        <input className={inputCls} value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej.: Pedido lentes de contacto (fra. 12345)" required />
      </div>

      <div className="grid grid-cols-3 gap-4 items-end">
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Base (sin IVA)</label>
          <input className={inputCls} value={neto} onChange={(e) => setNeto(e.target.value)} placeholder="0,00" inputMode="decimal" required />
        </div>
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">IVA (importe)</label>
          <input className={inputCls} value={iva} onChange={(e) => setIva(e.target.value)} placeholder="0,00" inputMode="decimal" />
        </div>
        <div className="text-[14px]">
          <div className="muted text-[13px]">Total</div>
          <div className="font-semibold text-[18px] mt-1">{eur(total)}</div>
        </div>
      </div>

      {error && <div className="text-[13px] text-[var(--tone-rose)]">{error}</div>}

      <div className="flex gap-3 mt-1">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-[var(--brand-teal-dark)] text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Guardar factura de proveedor"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-[14px] muted hover:bg-[var(--surface-2)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
