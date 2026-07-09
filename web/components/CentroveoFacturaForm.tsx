"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearCentroveoFactura } from "@/app/centroveo/actions";

// Formulario de factura emitida de Centroveo.
// El IVA no se elige a mano: lo fija el tipo de facturación.
//  - LENTES: venta de lentes de contacto, IVA 10%
//  - PROFESIONAL: servicios de optometría, exenta (art. 20 LIVA)
export function CentroveoFacturaForm({
  numeroSugerido,
  tipoInicial,
}: {
  numeroSugerido: string;
  tipoInicial: "LENTES" | "PROFESIONAL";
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"LENTES" | "PROFESIONAL">(tipoInicial);
  const [numero, setNumero] = useState(numeroSugerido);
  const [cliente, setCliente] = useState(tipoInicial === "PROFESIONAL" ? "Hospital Vithas Xanit" : "");
  const [concepto, setConcepto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [neto, setNeto] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const netoNum = parseFloat(neto.replace(",", ".")) || 0;
  const iva = tipo === "LENTES" ? Math.round(netoNum * 0.1 * 100) / 100 : 0;
  const total = Math.round((netoNum + iva) * 100) / 100;
  const eur = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const r = await crearCentroveoFactura({ numero, tipo, cliente, concepto, fecha, neto: netoNum });
    setEnviando(false);
    if (!r.ok) return setError(r.error);
    router.push(tipo === "LENTES" ? "/centroveo/emitidas" : "/centroveo/profesionales");
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]";

  return (
    <form onSubmit={enviar} className="card p-6 max-w-[620px] flex flex-col gap-4">
      {/* Tipo de facturación: decide el IVA automáticamente */}
      <div>
        <label className="muted text-[13px] font-medium block mb-1.5">Tipo de facturación</label>
        <div className="flex gap-2">
          <TipoBtn activo={tipo === "LENTES"} onClick={() => setTipo("LENTES")}>
            Venta de lentes · IVA 10%
          </TipoBtn>
          <TipoBtn
            activo={tipo === "PROFESIONAL"}
            onClick={() => {
              setTipo("PROFESIONAL");
              if (!cliente) setCliente("Hospital Vithas Xanit");
            }}
          >
            Servicios de optometría · exenta de IVA
          </TipoBtn>
        </div>
        {tipo === "PROFESIONAL" && (
          <p className="muted-2 text-[12px] mt-1.5">
            Exenta de IVA por ser servicios sanitarios (art. 20 LIVA).
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Número</label>
          <input className={inputCls} value={numero} onChange={(e) => setNumero(e.target.value)} required />
        </div>
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Fecha</label>
          <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="muted text-[13px] font-medium block mb-1.5">Cliente</label>
        <input
          className={inputCls}
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder={tipo === "LENTES" ? "Nombre del cliente" : "Hospital Vithas Xanit"}
          required
        />
      </div>

      <div>
        <label className="muted text-[13px] font-medium block mb-1.5">Concepto</label>
        <input
          className={inputCls}
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder={tipo === "LENTES" ? "Ej.: Lentes de contacto mensuales, 6 uds" : "Ej.: Consultas de optometría, junio"}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 items-end">
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Base (sin IVA)</label>
          <input
            className={inputCls}
            value={neto}
            onChange={(e) => setNeto(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
            required
          />
        </div>
        <div className="text-[14px]">
          <div className="muted text-[13px]">IVA {tipo === "LENTES" ? "(10%)" : "(exenta)"}</div>
          <div className="font-medium mt-1">{eur(iva)}</div>
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
          {enviando ? "Guardando..." : "Guardar factura"}
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

function TipoBtn({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
        activo
          ? "bg-[var(--accent-soft)] border-[rgba(78,143,132,.4)] text-[var(--brand-teal-dark)]"
          : "border-[var(--border)] muted hover:bg-[var(--surface-2)]"
      }`}
    >
      {children}
    </button>
  );
}
