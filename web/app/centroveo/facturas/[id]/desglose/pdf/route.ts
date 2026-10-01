import { prisma } from "@/lib/prisma";
import { generarDesglosePdf, type LineaPdf } from "@/lib/desglosePdf";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await prisma.centroveoFactura.findUnique({ where: { id } });
  if (!f) return new NextResponse("No encontrada", { status: 404 });

  let lineas: LineaPdf[] = [];
  if (f.lineasJson) {
    try {
      const parsed = JSON.parse(f.lineasJson);
      if (Array.isArray(parsed)) lineas = parsed;
    } catch {
      lineas = [];
    }
  }

  const pdf = await generarDesglosePdf({
    numero: f.numero,
    fecha: f.fecha,
    cliente: f.cliente,
    lineas,
    total: f.total,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Desglose Factura ${f.numero.replace(/\//g, "-")}.pdf"`,
    },
  });
}
