"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearPresupuesto, type LineaPresupuestoInput } from "@/app/presupuestos/actions";

type EmpresaOpt = {
  id: string;
  nombre: string;
  cif: string | null;
  direccion: string | null;
  pais: string | null;
};

const euro = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export function NuevoPresupuestoForm({ empresas }: { empresas: EmpresaOpt[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [empresaId, setEmpresaId] = useState("");
  const [conIva, setConIva] = useState(true);
  const [conAdelanto, setConAdelanto] = useState(false);
  const [adelantoPct, setAdelantoPct] = useState(30);
  const [lineas, setLineas] = useState<LineaPresupuestoInput[]>([
    { concepto: "Gorros quirófano personalizados", cantidad: 1, precioUnitario: 0 },
  ]);

  const elegirEmpresa = (id: string) => {
    setEmpresaId(id);
    const e = empresas.find((x) => x.id === id);
    // España con IVA; resto de Europa sin IVA (regla habitual de Lindilla)
    if (e?.pais && e.pais !== "España") setConIva(false);
    else setConIva(true);
  };

  const setLinea = (i: number, patch: Partial<LineaPresupuestoInput>) =>
    setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const neto = lineas.reduce((s, l) => s + (l.cantidad || 0) * (l.precioUnitario || 0), 0);
  const iva = conIva ? neto * 0.21 : 0;
  const total = neto + iva;
  const importeAdelanto = conAdelanto ? (total * adelantoPct) / 100 : 0;

  const guardar = () => {
    setError(null);
    startTransition(async () => {
      const r = await crearPresupuesto({
        empresaId,
        fecha,
        conIva,
        adelantoPct: conAdelanto ? adelantoPct : null,
        lineas,
      });
      if (r.ok) router.push(`/presupuestos/${r.id}/imprimir`);
      else setError(r.error);
    });
  };

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--brand-teal)]";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Formulario */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-[15px] mb-4">Datos del presupuesto</h2>
          <label className="text-[13px] muted">
            Fecha
            <input type="date" className={inputCls + " mt-1"} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-[15px] mb-4">Cliente</h2>
          <label className="text-[13px] muted">
            Empresa
            <select className={inputCls + " mt-1"} value={empresaId} onChange={(e) => elegirEmpresa(e.target.value)}>
              <option value="">— Elige una empresa —</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}{e.pais ? ` (${e.pais})` : ""}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[15px]">Productos / servicios</h2>
            <button
              type="button"
              onClick={() => setLineas((ls) => [...ls, { concepto: "", cantidad: 1, precioUnitario: 0 }])}
              className="text-[13px] font-semibold text-[var(--brand-teal-dark)] hover:underline"
            >
              + Añadir línea
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {lineas.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_110px_32px] gap-2 items-center">
                <input className={inputCls} placeholder="Concepto (ej. 300 gorros personalizados)" value={l.concepto} onChange={(e) => setLinea(i, { concepto: e.target.value })} />
                <input className={inputCls} type="number" min="0" step="1" placeholder="Cant." value={l.cantidad} onChange={(e) => setLinea(i, { cantidad: Number(e.target.value) })} />
                <input className={inputCls} type="number" min="0" step="0.01" placeholder="€/ud" value={l.precioUnitario} onChange={(e) => setLinea(i, { precioUnitario: Number(e.target.value) })} />
                <button
                  type="button"
                  onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))}
                  className="text-[var(--tone-rose)] text-[18px] leading-none hover:opacity-70"
                  title="Quitar línea"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="flex flex-col gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-[15px] mb-4">IVA</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConIva(true)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors ${conIva ? "bg-[var(--accent-soft)] border-[var(--brand-teal)] text-[var(--brand-teal-dark)]" : "border-[var(--border)] muted"}`}
            >
              Con IVA 21%
              <div className="text-[11px] font-normal muted-2">España</div>
            </button>
            <button
              type="button"
              onClick={() => setConIva(false)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors ${!conIva ? "bg-[var(--accent-soft)] border-[var(--brand-teal)] text-[var(--brand-teal-dark)]" : "border-[var(--border)] muted"}`}
            >
              Sin IVA
              <div className="text-[11px] font-normal muted-2">Resto de Europa</div>
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-[15px] mb-4">Adelanto</h2>
          <label className="flex items-center gap-2 text-[13px] mb-3">
            <input type="checkbox" checked={conAdelanto} onChange={(e) => setConAdelanto(e.target.checked)} />
            Pedir un adelanto al aceptar el presupuesto
          </label>
          {conAdelanto && (
            <label className="text-[13px] muted flex items-center gap-2">
              Porcentaje
              <input
                type="number"
                min="1"
                max="100"
                className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[14px]"
                value={adelantoPct}
                onChange={(e) => setAdelantoPct(Number(e.target.value))}
              />
              %
            </label>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-[15px] mb-4">Resumen</h2>
          <div className="flex flex-col gap-2 text-[14px]">
            <div className="flex justify-between"><span className="muted">Total neto</span><span className="font-semibold">{euro(neto)}</span></div>
            <div className="flex justify-between"><span className="muted">IVA {conIva ? "21%" : "(no aplica)"}</span><span className="font-semibold">{euro(iva)}</span></div>
            {conAdelanto && (
              <div className="flex justify-between text-[var(--brand-teal-dark)]">
                <span>Adelanto ({adelantoPct}%)</span><span className="font-semibold">{euro(importeAdelanto)}</span>
              </div>
            )}
            <div className="border-t border-[var(--border)] pt-2 mt-1 flex justify-between text-[17px]">
              <span className="font-semibold">TOTAL</span>
              <span className="font-bold text-[var(--brand-teal-dark)]">{euro(total)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[rgba(228,5,111,.3)] bg-[rgba(228,5,111,.06)] text-[var(--tone-rose)] px-4 py-3 text-[13px] font-medium">
            {error}
          </div>
        )}

        <button
          onClick={guardar}
          disabled={pending || !empresaId}
          className="rounded-xl bg-[var(--brand-teal)] text-white font-semibold py-3.5 text-[15px] hover:bg-[var(--brand-teal-dark)] transition-colors disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Generar presupuesto →"}
        </button>
        <p className="muted-2 text-[12px] -mt-2">
          El presupuesto no lleva número de factura ni cuenta para la numeración fiscal — es solo un documento informativo para el cliente.
        </p>
      </div>
    </div>
  );
}
