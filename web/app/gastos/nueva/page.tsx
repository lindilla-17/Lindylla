import { Page, PageHeader } from "@/components/ui";
import { NuevoGastoForm } from "@/components/NuevoGastoForm";

export const dynamic = "force-dynamic";

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
