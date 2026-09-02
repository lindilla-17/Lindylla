import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const gastos = await prisma.gasto.findMany({
    where: { OR: [{ proveedor: { contains: "seasons" } }, { proveedor: { contains: "Gls" } }, { proveedor: { contains: "gls" } }] },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    gastos.map((g) => ({
      id: g.id,
      fecha: g.fecha.toISOString().slice(0, 10),
      proveedor: g.proveedor,
      concepto: g.concepto,
      archivo: g.archivo,
      notas: g.notas,
      createdAt: g.createdAt.toISOString(),
    }))
  );
}
