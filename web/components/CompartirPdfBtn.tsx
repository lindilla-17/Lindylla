"use client";

import { useState } from "react";

// Descarga el PDF y abre directamente el menú nativo de "Compartir" del
// móvil (WhatsApp, Mail...), en vez de abrirlo primero en el visor y que
// haya que buscar el botón de compartir ahí. Si el navegador no soporta
// compartir archivos (algunos de escritorio), abre el PDF normal.
export function CompartirPdfBtn({ pdfHref, nombreArchivo }: { pdfHref: string; nombreArchivo: string }) {
  const [cargando, setCargando] = useState(false);

  const compartir = async () => {
    setCargando(true);
    try {
      const res = await fetch(pdfHref);
      const blob = await res.blob();
      const file = new File([blob], nombreArchivo, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: nombreArchivo });
      } else {
        window.location.href = pdfHref;
      }
    } catch (e) {
      // Si el usuario cancela el share no hacemos nada; si falla de verdad, abrimos el PDF normal.
      if (e instanceof Error && e.name !== "AbortError") window.location.href = pdfHref;
    } finally {
      setCargando(false);
    }
  };

  return (
    <button
      onClick={compartir}
      disabled={cargando}
      className="rounded-xl bg-[var(--brand-teal)] text-white font-semibold px-5 py-2.5 text-[14px] hover:bg-[var(--brand-teal-dark)] transition-colors disabled:opacity-50"
    >
      {cargando ? "Preparando…" : "📤 Compartir PDF"}
    </button>
  );
}
