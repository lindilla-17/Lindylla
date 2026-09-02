import { ListaFacturasCentroveo } from "../_lista-facturas";

export const dynamic = "force-dynamic";

// Centroveo · Facturas emitidas — venta de lentes de contacto (IVA 10%)
export default function EmitidasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <ListaFacturasCentroveo
      tipo="LENTES"
      titulo="Facturas emitidas"
      subtitulo="Venta de lentes de contacto · IVA 10%. Actividad sanitaria Centroveo."
      etiquetaIva="IVA repercutido (10%)"
      basePath="/centroveo/emitidas"
      searchParams={searchParams}
    />
  );
}
