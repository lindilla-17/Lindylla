import { prisma } from "@/lib/prisma";
import { Page, PageHeader } from "@/components/ui";
import { asegurarActividades, asegurarConfig } from "../actions";
import { ActividadesManager } from "@/components/ActividadesManager";
import { ComplementoForm } from "@/components/ComplementoForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Gestión de las actividades de la agenda: nombre, color, si es facturable y precio.
export default async function ActividadesPage() {
  let [actividades, config] = await Promise.all([
    prisma.centroveoActividad.findMany({ orderBy: { orden: "asc" } }),
    prisma.centroveoConfig.findUnique({ where: { id: "config" } }),
  ]);
  // Primera vez (base recién creada): crear defaults
  if (actividades.length === 0 || !config) {
    await Promise.all([asegurarActividades(), asegurarConfig()]);
    [actividades, config] = await Promise.all([
      prisma.centroveoActividad.findMany({ orderBy: { orden: "asc" } }),
      prisma.centroveoConfig.findUnique({ where: { id: "config" } }),
    ]);
  }

  return (
    <Page>
      <PageHeader
        title="Actividades y precios"
        subtitle="Define tus actividades: nombre, color, y si se facturan (con su precio) o son solo un registro."
      />
      <div className="mb-5">
        <Link href="/centroveo/agenda" className="text-[13px] text-[var(--brand-teal-dark)] hover:underline">← Volver a la agenda</Link>
      </div>
      <ActividadesManager
        actividades={actividades.map((a) => ({
          id: a.id, nombre: a.nombre, color: a.color, facturable: a.facturable, precio: a.precio, marcaDia: a.marcaDia, activa: a.activa,
        }))}
      />
      <div className="mt-6">
        <ComplementoForm inicial={{ importe: config?.complementoMensual ?? 0, concepto: config?.complementoConcepto ?? "Cuota de autónomos" }} />
      </div>
    </Page>
  );
}
