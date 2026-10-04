import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const gastos = await prisma.gasto.findMany({
    where: {
      OR: [
        { proveedor: { contains: "Guzm" } },
        { proveedor: { contains: "Galp" } },
        { proveedor: { contains: "Expansión" } },
        { proveedor: { contains: "Expansion" } },
        { proveedor: { contains: "Nadel" } },
      ],
      fecha: { gte: new Date("2026-09-01") },
    },
  });
  return NextResponse.json(gastos);
}
