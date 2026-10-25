import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const trabajos = await prisma.centroveoTrabajo.findMany({
    orderBy: { fecha: "desc" },
    select: { id: true, fecha: true, actividadId: true, cantidad: true, facturaId: true, createdAt: true },
  });
  return NextResponse.json({ total: trabajos.length, trabajos });
}
