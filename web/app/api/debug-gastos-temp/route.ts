import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [facturas, gastos, presupuestos, empresas, actividades, trabajos] = await Promise.all([
    prisma.factura.count(),
    prisma.gasto.count(),
    prisma.presupuesto.count(),
    prisma.empresa.count(),
    prisma.centroveoActividad.count(),
    prisma.centroveoTrabajo.count(),
  ]);
  return NextResponse.json({ facturas, gastos, presupuestos, empresas, actividades, trabajos });
}
