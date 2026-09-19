import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const facturas = await prisma.factura.findMany({
    where: { notas: { contains: "presupuesto" } },
    orderBy: { createdAt: "desc" },
    include: { empresa: true },
    take: 3,
  });
  return NextResponse.json(facturas);
}
