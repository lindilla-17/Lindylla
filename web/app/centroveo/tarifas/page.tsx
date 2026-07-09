import { prisma } from "@/lib/prisma";
import { Page, PageHeader } from "@/components/ui";
import { asegurarTarifas } from "../actions";
import { TRABAJOS } from "../trabajos";
import { TarifasForm } from "@/components/TarifasForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Precios por tipo de trabajo profesional (para calcular el importe de la agenda)
export default async function TarifasPage() {
  await asegurarTarifas();
  const tarifas = await prisma.centroveoTarifa.findMany();
  const inicial = Object.keys(TRABAJOS).map((tipo) => ({
    tipo,
    precio: tarifas.find((t) => t.tipo === tipo)?.precio ?? 0,
  }));

  return (
    <Page>
      <PageHeader
        title="Precios de los trabajos"
        subtitle="Precio de cada tipo de trabajo profesional. Se usa para calcular lo que suma la agenda cada mes."
      />
      <div className="mb-4">
        <Link href="/centroveo/agenda" className="text-[13px] text-[var(--brand-teal-dark)] hover:underline">← Volver a la agenda</Link>
      </div>
      <TarifasForm inicial={inicial} />
    </Page>
  );
}
