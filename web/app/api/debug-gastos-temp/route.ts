import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const empresa = await prisma.empresa.findFirst();
  if (!empresa) return NextResponse.json({ error: "no hay empresas" });

  const numero = "P99-PRUEBA";
  const p = await prisma.presupuesto.create({
    data: {
      numero,
      empresaId: empresa.id,
      fecha: new Date(),
      estado: "BORRADOR",
      conIva: false,
      lineas: { create: [{ concepto: "Prueba", cantidad: 2, precioUnitario: 10 }] },
    },
  });

  return NextResponse.json({ id: p.id, url: `/presupuestos/${p.id}/imprimir` });
}
