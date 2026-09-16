import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const empresa = await prisma.empresa.findFirst();
  if (!empresa) return NextResponse.json({ error: "no hay empresas" });

  const p = await prisma.presupuesto.create({
    data: {
      numero: "P99-PRUEBA2",
      empresaId: empresa.id,
      fecha: new Date(),
      estado: "BORRADOR",
      conIva: true,
      adelantoPct: 30,
      lineas: { create: [{ concepto: "Prueba adelanto", cantidad: 1, precioUnitario: 1000 }] },
    },
  });

  return NextResponse.json({ id: p.id, url: `/presupuestos/${p.id}/imprimir` });
}
