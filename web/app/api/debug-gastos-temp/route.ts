import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const desde = new Date("2026-07-01");
  const hasta = new Date("2026-10-01");

  const facturas = await prisma.factura.findMany({
    where: { fecha: { gte: desde, lt: hasta } },
    include: { empresa: true },
    orderBy: { fecha: "asc" },
  });

  const gastos = await prisma.gasto.findMany({
    where: { fecha: { gte: desde, lt: hasta } },
    orderBy: { fecha: "asc" },
  });

  return NextResponse.json({ facturas, gastos });
}
