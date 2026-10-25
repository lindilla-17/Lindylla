import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [ultimaFactura, ultimoGasto, ultimoTrabajo, ultimoPresupuesto] = await Promise.all([
    prisma.factura.findFirst({ orderBy: { createdAt: "desc" }, select: { numero: true, fecha: true, createdAt: true } }),
    prisma.gasto.findFirst({ orderBy: { createdAt: "desc" }, select: { concepto: true, fecha: true, createdAt: true } }),
    prisma.centroveoTrabajo.findFirst({ orderBy: { createdAt: "desc" }, select: { fecha: true, createdAt: true } }),
    prisma.presupuesto.findFirst({ orderBy: { createdAt: "desc" }, select: { fecha: true, createdAt: true } }),
  ]);
  return NextResponse.json({ ultimaFactura, ultimoGasto, ultimoTrabajo, ultimoPresupuesto });
}
