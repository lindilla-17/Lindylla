import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const gastos = await prisma.gasto.findMany({ orderBy: { createdAt: "desc" }, take: 15 });
  return NextResponse.json(
    gastos.map((g) => ({
      id: g.id,
      fecha: g.fecha.toISOString().slice(0, 10),
      proveedor: g.proveedor,
      archivo: g.archivo,
      notas: g.notas,
      createdAt: g.createdAt.toISOString(),
    }))
  );
}
