import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const g = await prisma.gasto.create({
    data: {
      concepto: "Producción gorros: impresión, tela, corte y confección (fra. 26F02681, pedidos 26E06589/26E06590/26E07243)",
      categoria: "MATERIAL",
      tipo: "SOCIEDAD",
      proveedor: "DTF a Profesionales (IMP Sport Wear S.L.)",
      fecha: new Date("2026-07-23"),
      neto: 377.78,
      iva: 79.33,
      importe: 457.11,
      estado: "PAGADO",
      archivo: "FACTURA 26F02681 LINDILLA SL.pdf",
    },
  });
  return NextResponse.json(g);
}
