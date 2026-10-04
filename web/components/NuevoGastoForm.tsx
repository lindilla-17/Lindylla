"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { crearGasto } from "@/app/gastos/actions";
import { comprimirImagen } from "@/lib/comprimirImagen";

const CATEGORIAS = [
  { value: "MATERIAL", label: "Material" },
  { value: "PERSONAL", label: "Personal" },
  { value: "LOGISTICA", label: "Logística" },
  { value: "GASOLINA", label: "Gasolina" },
  { value: "CONGRESO", label: "Congreso" },
  { value: "GENERAL", label: "General" },
];

const TIPOS_IVA = [21, 10, 4, 0];

type Linea = { base: string; pctIva: number; devolucion: boolean };

const num = (s: string) => parseFloat(s.replace(",", ".")) || 0;
const eur = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €";
// En el teclado numérico del móvil normalmente no hay signo "menos", así que
// una devolución se marca con una casilla en vez de escribir un negativo.
const baseEfectiva = (l: Linea) => (l.devolucion ? -Math.abs(num(l.base)) : num(l.base));

// Alta de un gasto de Lindilla (gorros). Permite adjuntar el justificante
// haciéndole una foto con la cámara del móvil (o eligiendo un archivo desde
// el ordenador); la foto se guarda sola en la carpeta de Drive que corresponda.
// Si la factura mezcla varios tipos de IVA (pasa a menudo), se añaden más
// renglones en vez de tener que registrar la misma factura varias veces.
export function NuevoGastoForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proveedor, setProveedor] = useState("");
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState("GENERAL");
  const [tipo, setTipo] = useState("SOCIEDAD");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [lineas, setLineas] = useState<Linea[]>([{ base: "", pctIva: 21, devolucion: false }]);
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const setLinea = (i: number, patch: Partial<Linea>) =>
    setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const neto = lineas.reduce((s, l) => s + baseEfectiva(l), 0);
  const iva = lineas.reduce((s, l) => s + Math.round(baseEfectiva(l) * (l.pctIva / 100) * 100) / 100, 0);
  const total = Math.round((neto + iva) * 100) / 100;

  async function elegirFoto(file: File | null) {
    if (file && file.type.startsWith("image/")) {
      try {
        file = await comprimirImagen(file);
      } catch {
        // si algo falla al comprimir, seguimos con la foto original
      }
    }
    setFoto(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!concepto.trim()) return setError("Escribe el concepto del gasto.");
    setEnviando(true);

    const formData = new FormData();
    formData.set("proveedor", proveedor);
    formData.set("concepto", concepto);
    formData.set("categoria", categoria);
    formData.set("tipo", tipo);
    formData.set("fecha", fecha);
    formData.set(
      "lineas",
      JSON.stringify(lineas.map((l) => ({ base: baseEfectiva(l), pctIva: l.pctIva })))
    );
    if (foto) formData.set("archivo", foto);

    try {
      const r = await crearGasto(formData);
      if (!r.ok) {
        setEnviando(false);
        return setError(r.error);
      }
      router.push("/gastos");
    } catch {
      setEnviando(false);
      setError("No se ha podido guardar. Comprueba la conexión (si es una foto muy grande, prueba con menos calidad) e inténtalo de nuevo.");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-[var(--brand-teal-dark)]";

  return (
    <form onSubmit={enviar} className="card p-6 max-w-[620px] flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Proveedor</label>
          <input className={inputCls} value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Ej.: Tejidos Málaga S.L." />
        </div>
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Fecha</label>
          <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="muted text-[13px] font-medium block mb-1.5">Concepto</label>
        <input className={inputCls} value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej.: Tela para gorros (fra. 8821)" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Categoría</label>
          <select className={inputCls} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Tipo de gasto</label>
          <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="SOCIEDAD">De la sociedad (Lindilla S.L.)</option>
            <option value="MIOS">Mío, personal</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="muted text-[13px] font-medium">Base imponible por tipo de IVA</label>
          {lineas.length < TIPOS_IVA.length && (
            <button
              type="button"
              onClick={() => {
                const usados = new Set(lineas.map((l) => l.pctIva));
                const siguiente = TIPOS_IVA.find((p) => !usados.has(p)) ?? 21;
                setLineas((ls) => [...ls, { base: "", pctIva: siguiente, devolucion: false }]);
              }}
              className="text-[12px] font-semibold text-[var(--brand-teal-dark)] hover:underline"
            >
              + Añadir renglón con otro IVA
            </button>
          )}
        </div>
        <p className="muted-2 text-[11px] mb-2">Si la factura mezcla varios tipos de IVA, añade un renglón por cada uno — el IVA se calcula solo.</p>
        <div className="flex flex-col gap-2">
          {lineas.map((l, i) => (
            <div key={i} className="flex flex-col gap-1.5 pb-2 border-b border-[var(--border-soft)] last:border-0 last:pb-0">
              <div className="grid grid-cols-[1fr_90px_90px_28px] gap-2 items-center">
                <input
                  className={inputCls}
                  value={l.base}
                  onChange={(e) => setLinea(i, { base: e.target.value })}
                  placeholder="Base sin IVA"
                  inputMode="decimal"
                />
                <select
                  className={inputCls}
                  value={l.pctIva}
                  onChange={(e) => setLinea(i, { pctIva: Number(e.target.value) })}
                >
                  {TIPOS_IVA.map((p) => (
                    <option key={p} value={p}>{p}%</option>
                  ))}
                </select>
                <div className={`text-[13px] text-right pr-1 ${l.devolucion ? "text-[var(--tone-rose)]" : "muted"}`}>
                  {l.devolucion ? "−" : "+"}{eur(Math.abs(Math.round(baseEfectiva(l) * (l.pctIva / 100) * 100) / 100))}
                </div>
                {lineas.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))}
                    className="text-[var(--tone-rose)] text-[18px] leading-none hover:opacity-70"
                    title="Quitar renglón"
                  >
                    ×
                  </button>
                ) : (
                  <span />
                )}
              </div>
              <label className="flex items-center gap-1.5 text-[12px] muted-2">
                <input type="checkbox" checked={l.devolucion} onChange={(e) => setLinea(i, { devolucion: e.target.checked })} />
                Es una devolución o abono (resta en vez de sumar)
              </label>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)] text-[14px]">
          <span className="muted">Total ({eur(neto)} + {eur(iva)} IVA)</span>
          <span className="font-semibold text-[18px]">{eur(total)}</span>
        </div>
      </div>

      <div>
        <label className="muted text-[13px] font-medium block mb-1.5">Justificante (foto del recibo o factura)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="hidden"
          onChange={(e) => elegirFoto(e.target.files?.[0] ?? null)}
        />
        {previewUrl ? (
          <div className="flex items-center gap-3">
            {foto?.type === "application/pdf" ? (
              <div className="w-24 h-24 rounded-lg border border-[var(--border)] flex items-center justify-center text-[12px] muted">PDF</div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Justificante" className="w-24 h-24 object-cover rounded-lg border border-[var(--border)]" />
            )}
            <div className="flex flex-col gap-2">
              <span className="text-[13px] muted">{foto?.name}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[12px] text-[var(--brand-teal-dark)] hover:underline">
                  Cambiar
                </button>
                <button type="button" onClick={() => elegirFoto(null)} className="text-[12px] text-[var(--tone-rose)] hover:underline">
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg border border-dashed border-[var(--border)] px-3 py-4 text-[14px] muted hover:bg-[var(--surface-2)] transition-colors flex items-center justify-center gap-2"
          >
            📷 Hacer foto o elegir archivo
          </button>
        )}
      </div>

      {error && <div className="text-[13px] text-[var(--tone-rose)]">{error}</div>}

      <div className="flex gap-3 mt-1">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-[var(--brand-teal-dark)] text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Guardar gasto"}
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
