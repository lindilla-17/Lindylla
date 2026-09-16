import { prisma } from "@/lib/prisma";
import { Page, PageHeader } from "@/components/ui";
import { NuevoPresupuestoForm } from "@/components/NuevoPresupuestoForm";

export const dynamic = "force-dynamic";

export default async function NuevoPresupuestoPage() {
  // Solo empresas con carpeta en "trabajos empresas" — las que de verdad se usan
  // para pedidos reales, no fichas sueltas sin carpeta asignada.
  const empresas = await prisma.empresa.findMany({
    where: { carpeta: { not: null } },
    orderBy: { nombre: "asc" },
  });

  return (
    <Page>
      <PageHeader
        title="Nuevo presupuesto"
        subtitle="Documento informativo para el cliente, sin número de factura. Puedes hacerlo sin IVA para clientes de fuera de España."
      />
      <NuevoPresupuestoForm
        empresas={empresas.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          cif: e.cif,
          direccion: e.direccion,
          pais: e.pais,
        }))}
      />
    </Page>
  );
}
