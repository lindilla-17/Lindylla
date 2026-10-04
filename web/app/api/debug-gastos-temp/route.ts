import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const factura = await prisma.factura.findFirst({ where: { numero: "2615" } });
  if (!factura) return NextResponse.json({ error: "no encontrada" });

  const actualizada = await prisma.factura.update({
    where: { id: factura.id },
    data: {
      estado: "PAGADA",
      fechaPago: new Date(),
      notas: null,
      lineasJson: null, // ya no queda "resto a pagar": se cobró todo
    },
  });

  return NextResponse.json({ antes: factura, despues: actualizada });
}
