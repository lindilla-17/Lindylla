import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Page, PageHeader } from "@/components/ui";
import { NuevaFacturaForm } from "@/components/NuevaFacturaForm";
import type { LineaFactura } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarFacturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [f, empresas] = await Promise.all([
    prisma.factura.findUnique({ where: { id } }),
    prisma.empresa.findMany({ orderBy: { nombre: "asc" } }),
  ]);
  if (!f) notFound();

  let lineas: LineaFactura[] = [{ concepto: f.concepto ?? "", cantidad: 1, precioUnitario: f.neto }];
  if (f.lineasJson) {
    const data = JSON.parse(f.lineasJson);
    // Puede ser un array o { lineas, parcial } en facturas de adelanto/resto
    lineas = Array.isArray(data) ? data : data.lineas ?? lineas;
  }

  return (
    <Page>
      <PageHeader
        title={`Corregir factura ${f.numero}`}
        subtitle="Corrige los datos conservando el número. ⚠ Si la factura ya se envió al cliente o se declaró, no la edites: emite una rectificativa (con importe negativo) y una nueva."
      />
      <NuevaFacturaForm
        empresas={empresas.map((e) => ({ id: e.id, nombre: e.nombre, cif: e.cif, direccion: e.direccion, pais: e.pais }))}
        siguienteNumero={f.numero}
        inicial={{
          id: f.id,
          numero: f.numero,
          fecha: f.fecha.toISOString().slice(0, 10),
          empresaId: f.empresaId,
          conIva: f.iva !== 0,
          lineas,
        }}
      />
    </Page>
  );
}
