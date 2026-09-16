import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const empresa = await prisma.empresa.findFirst({ where: { nombre: { contains: "Promedwork" } } });
  const presupuestos = await prisma.presupuesto.findMany({ where: { empresaId: empresa?.id }, include: { lineas: true } });
  return NextResponse.json({ empresa, presupuestos });
}
