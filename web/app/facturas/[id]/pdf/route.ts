import { prisma } from "@/lib/prisma";
import { generarFacturaLindillaPdf, type LineaPdf, type ParcialPdf } from "@/lib/facturaLindillaPdf";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// lineasJson puede ser un array de líneas, o { lineas, parcial } en facturas de adelanto/resto
function parseLineasJson(json: string | null, fallback: LineaPdf): { lineas: LineaPdf[]; parcial: ParcialPdf } {
  if (!json) return { lineas: [fallback], parcial: null };
  try {
    const data = JSON.parse(json);
    if (Array.isArray(data)) return { lineas: data, parcial: null };
    return { lineas: data.lineas ?? [fallback], parcial: data.parcial ?? null };
  } catch {
    return { lineas: [fallback], parcial: null };
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await prisma.factura.findUnique({ where: { id }, include: { empresa: true } });
  if (!f) return new NextResponse("No encontrada", { status: 404 });

  const { lineas, parcial } = parseLineasJson(f.lineasJson, {
    concepto: f.concepto ?? "Gorros quirófano personalizados",
    cantidad: 1,
    precioUnitario: f.neto,
  });

  const pdf = await generarFacturaLindillaPdf({
    numero: f.numero,
    fecha: f.fecha,
    clienteNombre: f.empresa.nombre,
    clienteDireccion: f.empresa.direccion,
    clienteCif: f.empresa.cif,
    lineas,
    neto: f.neto,
    iva: f.iva,
    total: f.total,
    parcial,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // "inline" (no "attachment"): en el móvil se abre en el visor de PDF de
      // Safari, que tiene su propio botón de compartir arriba.
      "Content-Disposition": `inline; filename="Factura ${f.numero}.pdf"`,
    },
  });
}
