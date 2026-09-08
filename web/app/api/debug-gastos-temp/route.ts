import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const config = await prisma.centroveoConfig.findFirst();
  const ultimasFacturas = await prisma.centroveoFactura.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return NextResponse.json({
    ultimoNumeroManual: config?.ultimoNumeroManual,
    ultimasFacturas: ultimasFacturas.map((f) => ({
      numero: f.numero,
      fecha: f.fecha.toISOString().slice(0, 10),
      cliente: f.cliente,
      createdAt: f.createdAt.toISOString(),
    })),
  });
}
