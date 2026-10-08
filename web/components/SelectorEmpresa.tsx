"use client";

import { useState, useTransition } from "react";
import { crearEmpresa, type EmpresaCreada } from "@/app/empresas/actions";

export type EmpresaOpt = {
  id: string;
  nombre: string;
  cif: string | null;
  direccion: string | null;
  pais: string | null;
};

const NUEVA = "__nueva__";

// Desplegable de empresa con opción de alta rápida: si el cliente todavía no
// existe, se da de alta sin salir del formulario de presupuesto/factura y
// queda elegida al momento. A partir de ahí aparece también en el resto de
// desplegables (ya se ha guardado en la base de datos de verdad).
export function SelectorEmpresa({
  empresas: empresasIniciales,
  value,
  onChange,
  inputCls,
}: {
  empresas: EmpresaOpt[];
  value: string;
  onChange: (id: string, empresa: EmpresaOpt | undefined) => void;
  inputCls: string;
}) {
  const [empresas, setEmpresas] = useState(empresasIniciales);
  const [creando, setCreando] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [cif, setCif] = useState("");
  const [pais, setPais] = useState("");
  const [direccion, setDireccion] = useState("");

  const elegir = (id: string) => {
    if (id === NUEVA) {
      setCreando(true);
      setError(null);
      return;
    }
    onChange(id, empresas.find((e) => e.id === id));
  };

  const cancelar = () => {
    setCreando(false);
    setError(null);
    setNombre("");
    setCif("");
    setPais("");
    setDireccion("");
  };

  const guardarEmpresa = () => {
    setError(null);
    startTransition(async () => {
      const r = await crearEmpresa({ nombre, cif, pais, direccion });
      if (!r.ok) return setError(r.error);
      const nueva: EmpresaCreada = r.empresa;
      setEmpresas((es) => [...es, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      onChange(nueva.id, nueva);
      cancelar();
    });
  };

  if (creando) {
    return (
      <div className="rounded-lg border border-[var(--brand-teal)] bg-[var(--accent-soft)] p-3.5 flex flex-col gap-2.5">
        <div className="text-[13px] font-semibold text-[var(--brand-teal-dark)]">Nueva empresa</div>
        <input className={inputCls} placeholder="Nombre de la empresa *" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-2.5">
          <input className={inputCls} placeholder="CIF / NIF" value={cif} onChange={(e) => setCif(e.target.value)} />
          <input className={inputCls} placeholder="País (vacío = España)" value={pais} onChange={(e) => setPais(e.target.value)} />
        </div>
        <input className={inputCls} placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        {error && <div className="text-[12px] text-[var(--tone-rose)]">{error}</div>}
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={guardarEmpresa}
            disabled={pending || !nombre.trim()}
            className="rounded-lg bg-[var(--brand-teal-dark)] text-white px-3 py-1.5 text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar empresa"}
          </button>
          <button type="button" onClick={cancelar} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[13px] muted hover:bg-[var(--surface-2)]">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <select className={inputCls} value={value} onChange={(e) => elegir(e.target.value)}>
      <option value="">— Elige una empresa —</option>
      {empresas.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nombre}{e.pais ? ` (${e.pais})` : ""}
        </option>
      ))}
      <option value={NUEVA}>+ Añadir nueva empresa…</option>
    </select>
  );
}
