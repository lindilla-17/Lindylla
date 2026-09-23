import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const gastos = await prisma.gasto.findMany({
    where: {
      OR: [
        { proveedor: { contains: "SPORT WEAR" } },
        { proveedor: { contains: "DTF" } },
        { concepto: { contains: "26F02681" } },
        { archivo: { contains: "26F02681" } },
      ],
    },
  });
  return NextResponse.json(gastos);
}
