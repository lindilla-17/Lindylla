import { prisma } from "@/lib/prisma";
import { Page, PageHeader } from "@/components/ui";
import { asegurarActividades } from "../actions";
import { ActividadesManager } from "@/components/ActividadesManager";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Gestión de las actividades de la agenda: nombre, color, si es facturable y precio.
export default async function ActividadesPage() {
  await asegurarActividades();
  const actividades = await prisma.centroveoActividad.findMany({ orderBy: { orden: "asc" } });

  return (
    <Page>
      <PageHeader
        title="Actividades de la agenda"
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
    </Page>
  );
}
