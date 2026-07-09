import { ListaFacturasCentroveo } from "../_lista-facturas";

export const dynamic = "force-dynamic";

// Centroveo · Facturas emitidas — venta de lentes de contacto (IVA 10%)
export default function EmitidasPage() {
  return (
    <ListaFacturasCentroveo
      tipo="LENTES"
      titulo="Facturas emitidas"
      subtitulo="Venta de lentes de contacto · IVA 10%. Actividad sanitaria Centroveo."
      etiquetaIva="IVA repercutido (10%)"
    />
  );
}
