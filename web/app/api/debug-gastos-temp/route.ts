import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const g = await prisma.gasto.create({
    data: {
      concepto: "Producción gorros sin confección: impresión, tela y corte (fra. 26F03433, pedido 26E09288)",
      categoria: "MATERIAL",
      tipo: "SOCIEDAD",
      proveedor: "DTF a Profesionales (IMP Sport Wear S.L.)",
      fecha: new Date("2026-09-22"),
      neto: 147.35,
      iva: 30.94,
      importe: 178.29,
      estado: "PAGADO",
      archivo: "FACTURA 26F03433 LINDILLA SL.pdf",
    },
  });
  return NextResponse.json(g);
}
