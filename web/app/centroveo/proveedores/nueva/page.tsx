import { Page, PageHeader } from "@/components/ui";
import { CentroveoGastoForm } from "@/components/CentroveoGastoForm";

export const dynamic = "force-dynamic";

// Centroveo · Nueva factura de proveedor
export default function NuevaProveedorPage() {
  return (
    <Page>
      <PageHeader
        title="Nueva factura de proveedor · Centroveo"
        subtitle="Registra una factura recibida de un proveedor de la actividad sanitaria."
      />
      <CentroveoGastoForm />
    </Page>
  );
}
