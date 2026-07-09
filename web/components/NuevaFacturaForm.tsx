"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearFactura, actualizarFactura, type LineaFactura } from "@/app/facturas/actions";

type EmpresaOpt = {
  id: string;
  nombre: string;
  cif: string | null;
  direccion: string | null;
  pais: string | null;
};

const euro = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export type FacturaInicial = {
  id: string;
  numero: string;
  fecha: string; // yyyy-mm-dd
  empresaId: string;
  conIva: boolean;
  lineas: LineaFactura[];
};

export function NuevaFacturaForm({
  empresas,
  siguienteNumero,
  inicial,
}: {
  empresas: EmpresaOpt[];
  siguienteNumero: string;
  inicial?: FacturaInicial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date().toISOString().slice(0, 10);
  const empresaInicial = inicial ? empresas.find((e) => e.id === inicial.empresaId) : undefined;
  const [numero, setNumero] = useState(inicial?.numero ?? siguienteNumero);
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy);
  const [empresaId, setEmpresaId] = useState(inicial?.empresaId ?? "");
  const [cif, setCif] = useState(empresaInicial?.cif ?? "");
  const [direccion, setDireccion] = useState(empresaInicial?.direccion ?? "");
  const [conIva, setConIva] = useState(inicial?.conIva ?? true);
  const [lineas, setLineas] = useState<LineaFactura[]>(
    inicial?.lineas ?? [{ concepto: "Gorros quirófano personalizados", cantidad: 1, precioUnitario: 0 }]
  );

  const elegirEmpresa = (id: string) => {
    setEmpresaId(id);
    const e = empresas.find((x) => x.id === id);
    setCif(e?.cif ?? "");
    setDireccion(e?.direccion ?? "");
    // España con IVA; resto de Europa sin IVA (regla habitual de Lindilla)
    if (e?.pais && e.pais !== "España") setConIva(false);
    else setConIva(true);
  };

  const setLinea = (i: number, patch: Partial<LineaFactura>) =>
    setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const neto = lineas.reduce((s, l) => s + (l.cantidad || 0) * (l.precioUnitario || 0), 0);
  const iva = conIva ? neto * 0.21 : 0;
  const total = neto + iva;

  const guardar = () => {
    setError(null);
    startTransition(async () => {
      const datos = { numero, empresaId, fecha, conIva, lineas, cif, direccion };
      const r = inicial ? await actualizarFactura(inicial.id, datos) : await crearFactura(datos);
      if (r.ok) router.push(`/facturas/${r.id}/imprimir`);
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
          <h2 className="font-semibold text-[15px] mb-4">Datos de la factura</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-[13px] muted">
              Número de factura
              <input className={inputCls + " mt-1 font-mono"} value={numero} onChange={(e) => setNumero(e.target.value)} />
            </label>
            <label className="text-[13px] muted">
              Fecha
              <input type="date" className={inputCls + " mt-1"} value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-[15px] mb-4">Cliente</h2>
          <div className="flex flex-col gap-4">
            <label className="text-[13px] muted">
              Empresa
              <select className={inputCls + " mt-1"} value={empresaId} onChange={(e) => elegirEmpresa(e.target.value)}>
                <option value="">— Elige una empresa —</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}{e.pais ? ` (${e.pais})` : ""}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-[13px] muted">
                CIF / NIF
                <input className={inputCls + " mt-1"} value={cif} onChange={(e) => setCif(e.target.value)} placeholder="ej. A60567922" />
              </label>
              <label className="text-[13px] muted">
                Dirección
                <input className={inputCls + " mt-1"} value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle, CP, ciudad" />
              </label>
            </div>
          </div>
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
          <h2 className="font-semibold text-[15px] mb-4">Resumen</h2>
          <div className="flex flex-col gap-2 text-[14px]">
            <div className="flex justify-between"><span className="muted">Total neto</span><span className="font-semibold">{euro(neto)}</span></div>
            <div className="flex justify-between"><span className="muted">IVA {conIva ? "21%" : "(no aplica)"}</span><span className="font-semibold">{euro(iva)}</span></div>
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
          {pending ? "Guardando…" : inicial ? "Guardar cambios →" : "Generar factura →"}
        </button>
        <p className="muted-2 text-[12px] -mt-2">
          {inicial
            ? "Se corrige la factura conservando su número. Si ya la enviaste al cliente, lo correcto es emitir una rectificativa en su lugar."
            : "Se guarda como Pendiente de cobro y se abre lista para imprimir o guardar en PDF."}
        </p>
      </div>
    </div>
  );
}
