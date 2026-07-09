import { Page, PageHeader } from "@/components/ui";
import { CentroveoFacturaForm } from "@/components/CentroveoFacturaForm";
import { siguienteNumeroCentroveo } from "../actions";

export const dynamic = "force-dynamic";

// Centroveo · Nueva factura emitida.
// ?tipo=LENTES (por defecto) o ?tipo=PROFESIONAL preselecciona el tipo;
// en el formulario se puede cambiar y el IVA se ajusta solo.
export default async function NuevaCentroveoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tipo = params.tipo === "PROFESIONAL" ? "PROFESIONAL" : "LENTES";
  const numeroSugerido = await siguienteNumeroCentroveo();

  return (
    <Page>
      <PageHeader
        title="Nueva factura · Centroveo"
        subtitle="El IVA se aplica solo según el tipo: lentes de contacto al 10%, servicios de optometría exentos."
      />
      <CentroveoFacturaForm numeroSugerido={numeroSugerido} tipoInicial={tipo} />
    </Page>
  );
}
