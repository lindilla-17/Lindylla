import { prisma } from "@/lib/prisma";
import { Page, PageHeader } from "@/components/ui";
import { SubirFotoGastoForm } from "@/components/SubirFotoGastoForm";
import { euroExacto, fecha as fmtFecha } from "@/lib/format";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
// Igual que en el alta: la subida a Drive necesita más de los 10s por defecto.
export const maxDuration = 60;

export default async function FotoGastoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gasto = await prisma.gasto.findUnique({ where: { id } });
  if (!gasto) notFound();

  const resumen = `${fmtFecha(gasto.fecha)} · ${gasto.proveedor ?? gasto.concepto} · ${euroExacto(gasto.importe)}`;

  return (
    <Page>
      <PageHeader
        title="Adjuntar foto del gasto"
        subtitle="Añade el justificante a este gasto ya existente, sin crear uno nuevo."
      />
      <SubirFotoGastoForm gastoId={gasto.id} resumen={resumen} />
    </Page>
  );
}
