import { prisma } from "@/lib/prisma";
import { siguienteNumeroFactura } from "../actions";
import { Page, PageHeader } from "@/components/ui";
import { NuevaFacturaForm } from "@/components/NuevaFacturaForm";

export const dynamic = "force-dynamic";

export default async function NuevaFacturaPage() {
  const [empresas, siguienteNumero] = await Promise.all([
    prisma.empresa.findMany({ orderBy: { nombre: "asc" } }),
    siguienteNumeroFactura(),
  ]);

  return (
    <Page>
      <PageHeader
        title="Nueva factura"
        subtitle="Rellena los datos y genera la factura lista para imprimir o guardar en PDF. El número se propone solo, siguiendo tu serie."
      />
      <NuevaFacturaForm
        empresas={empresas.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          cif: e.cif,
          direccion: e.direccion,
          pais: e.pais,
        }))}
        siguienteNumero={siguienteNumero}
      />
    </Page>
  );
}
