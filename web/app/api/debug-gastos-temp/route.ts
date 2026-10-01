import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const facturas = await prisma.centroveoFactura.findMany({
    where: { cliente: { contains: "Cilveti" } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  return NextResponse.json(facturas);
}
