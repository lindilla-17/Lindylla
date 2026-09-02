import { ListaFacturasCentroveo } from "../_lista-facturas";

export const dynamic = "force-dynamic";

// Centroveo · Facturas de trabajos profesionales — servicios de optometría
// de Mercedes Marcos en el Hospital Vithas Xanit (exentas de IVA, art. 20 LIVA)
export default function ProfesionalesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <ListaFacturasCentroveo
      tipo="PROFESIONAL"
      titulo="Facturas de trabajos profesionales"
      subtitulo="Servicios de optometría facturados a Cilveti Lapeira S.L. · exentas de IVA (servicios sanitarios)."
      etiquetaIva="IVA (exentas)"
      basePath="/centroveo/profesionales"
      searchParams={searchParams}
    />
  );
}
