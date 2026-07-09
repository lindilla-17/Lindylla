import { prisma } from "@/lib/prisma";
import { euroExacto } from "@/lib/format";
import { Page, PageHeader, StatCard, Panel, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const productos = await prisma.producto.findMany({ orderBy: { categoria: "asc" } });
  const gorros = productos.filter((p) => p.categoria === "GORRO");
  const otros = productos.filter((p) => p.categoria !== "GORRO");

  return (
    <Page>
      <PageHeader
        title="Productos"
        subtitle="Catálogo flexible. El gorro es el producto principal, pero admite cualquier otro artículo."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Productos activos" value={String(productos.filter((p) => p.activo).length)} />
        <StatCard label="Modelos de gorro" value={String(gorros.length)} tone="sky" />
        <StatCard label="Otros artículos" value={String(otros.length)} tone="indigo" />
      </div>

      <Panel title="Catálogo">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="text-right">Precio base</th>
                <th className="text-right">Consumo tela</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="font-medium">{p.nombre}</div>
                    {p.descripcion && <div className="muted-2 text-[12px] mt-0.5">{p.descripcion}</div>}
                  </td>
                  <td>
                    <Badge variant={p.categoria === "GORRO" ? "sky" : "indigo"}>
                      {p.categoria === "GORRO" ? "Gorro" : "Otro"}
                    </Badge>
                  </td>
                  <td className="text-right font-semibold">{euroExacto(p.precioBase)}<span className="muted-2 text-[12px]">/{p.unidad}</span></td>
                  <td className="text-right muted">{p.consumoTelaCm ? `${p.consumoTelaCm} cm` : "—"}</td>
                  <td>
                    <Badge variant={p.activo ? "green" : "slate"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </Page>
  );
}
