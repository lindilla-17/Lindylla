import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Ruta temporal de diagnóstico — borrar después de usarla.
export async function GET() {
  const gastos = await prisma.gasto.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json(
    gastos.map((g) => ({
      id: g.id,
      fecha: g.fecha.toISOString().slice(0, 10),
      proveedor: g.proveedor,
      concepto: g.concepto,
      categoria: g.categoria,
      tipo: g.tipo,
      importe: g.importe,
      archivo: g.archivo,
      notas: g.notas,
      createdAt: g.createdAt.toISOString(),
    }))
  );
}
