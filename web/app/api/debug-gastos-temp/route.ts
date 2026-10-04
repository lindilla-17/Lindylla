import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const borrados = [];
  for (const id of ["cmuu7pbjg0000l304dcydszng", "cmuu7pbjs0001l304wvk2nhz7"]) {
    const g = await prisma.gasto.findUnique({ where: { id } });
    if (!g) continue;
    await prisma.gasto.delete({ where: { id } });
    borrados.push({ id, concepto: g.concepto, importe: g.importe });
  }
  return NextResponse.json({ borrados });
}
