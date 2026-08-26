import { Page, PageHeader } from "@/components/ui";
import { NuevoGastoForm } from "@/components/NuevoGastoForm";

export const dynamic = "force-dynamic";
// La subida del justificante a Drive implica varias llamadas seguidas a la
// API de Google (autenticación + buscar/crear carpetas + subir el archivo);
// el límite por defecto de la función (10s) se quedaba corto en algunos
// casos y la foto se perdía en silencio aunque el gasto sí se guardaba.
export const maxDuration = 60;

export default function NuevoGastoPage() {
  return (
    <Page>
      <PageHeader
        title="Nuevo gasto"
        subtitle="Registra un gasto de Lindilla (gorros). Puedes adjuntar la foto del recibo o la factura desde el móvil."
      />
      <NuevoGastoForm />
    </Page>
  );
}
