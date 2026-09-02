"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { subirFotoGastoExistente } from "@/app/gastos/actions";
import { comprimirImagen } from "@/lib/comprimirImagen";

// Adjunta (o reintenta) la foto del justificante de un gasto que ya existe,
// sin duplicarlo — pensado para cuando la subida a Drive falló la primera vez.
export function SubirFotoGastoForm({ gastoId, resumen }: { gastoId: string; resumen: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

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
    if (!foto) return setError("Elige una foto o archivo primero.");
    setEnviando(true);

    const formData = new FormData();
    formData.set("archivo", foto);

    try {
      const r = await subirFotoGastoExistente(gastoId, formData);
      if (!r.ok) {
        setEnviando(false);
        return setError(r.error);
      }
      router.push("/gastos");
    } catch {
      setEnviando(false);
      setError("No se ha podido guardar. Comprueba la conexión e inténtalo de nuevo.");
    }
  }

  return (
    <form onSubmit={enviar} className="card p-6 max-w-[620px] flex flex-col gap-4">
      <div className="text-[14px] muted">{resumen}</div>

      <div>
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
          disabled={enviando || !foto}
          className="rounded-lg bg-[var(--brand-teal-dark)] text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enviando ? "Subiendo..." : "Subir foto"}
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
