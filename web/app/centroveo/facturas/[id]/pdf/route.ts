import { prisma } from "@/lib/prisma";
import { generarFacturaCentroveoPdf } from "@/lib/facturaPdf";
import { NextResponse } from "next/server";
import { CIF_CLIENTE } from "../../../trabajos";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await prisma.centroveoFactura.findUnique({ where: { id } });
  if (!f) return new NextResponse("No encontrada", { status: 404 });

  const pdf = await generarFacturaCentroveoPdf({
    numero: f.numero,
    fecha: f.fecha,
    cliente: f.cliente,
    cifCliente: CIF_CLIENTE[f.cliente],
    concepto: f.concepto || "Servicios profesionales",
    neto: f.neto,
    iva: f.iva,
    total: f.total,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // "inline" (no "attachment"): en el móvil se abre en el visor de PDF de
      // Safari, que tiene su propio botón de compartir arriba.
      "Content-Disposition": `inline; filename="Factura ${f.numero.replace(/\//g, "-")}.pdf"`,
    },
  });
}
