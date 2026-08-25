"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { crearGasto } from "@/app/gastos/actions";

// Reduce la foto del móvil (a veces 10-20MB en un iPhone reciente) a un
// tamaño manejable antes de subirla, sin que Mercedes tenga que tocar nada
// en los ajustes de la cámara. 1800px de lado más largo es de sobra para
// leer un recibo o factura.
async function comprimirImagen(file: File, maxLado = 1800, calidad = 0.75): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, ancho, alto);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", calidad));
  if (!blob || blob.size >= file.size) return file;

  const nombre = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], nombre, { type: "image/jpeg" });
}

const CATEGORIAS = [
  { value: "MATERIAL", label: "Material" },
  { value: "PERSONAL", label: "Personal" },
  { value: "LOGISTICA", label: "Logística" },
  { value: "GASOLINA", label: "Gasolina" },
  { value: "CONGRESO", label: "Congreso" },
  { value: "GENERAL", label: "General" },
];

// Alta de un gasto de Lindilla (gorros). Permite adjuntar el justificante
// haciéndole una foto con la cámara del móvil (o eligiendo un archivo desde
// el ordenador); la foto se guarda sola en la carpeta de Drive que corresponda.
export function NuevoGastoForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proveedor, setProveedor] = useState("");
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState("GENERAL");
  const [tipo, setTipo] = useState("SOCIEDAD");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [neto, setNeto] = useState("");
  const [iva, setIva] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const num = (s: string) => parseFloat(s.replace(",", ".")) || 0;
  const total = Math.round((num(neto) + num(iva)) * 100) / 100;
  const eur = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €";

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
    formData.set("neto", neto || "0");
    formData.set("iva", iva || "0");
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

      <div className="grid grid-cols-3 gap-4 items-end">
        <div>
          <label className="muted text-[13px] font-medium block mb-1.5">Base (sin IVA)</label>
          <input className={inputCls} value={neto} onChange={(e) => setNeto(e.target.value)} placeholder="0,00" inputMode="decimal" />
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
