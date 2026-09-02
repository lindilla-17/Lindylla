import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Ruta temporal — borra los 7 gastos duplicados identificados el 02/09/2026 y se elimina después.
const idsABorrar = [
  "cmt95ahrt0001kz04r7l8gijm",
  "cmt959c9p0000ib04me54shj5",
  "cmt957fiu0001l104dithxxy0",
  "cmt955hbt0000l104poj4w3ee",
  "cmt952meq0000l40467vg6y72",
  "cmt94y9hc0000kz04k5kuc9se",
  "cmtjx5r7c0005jo0435sqdsnq",
];

export async function GET() {
  const borrados: string[] = [];
  for (const id of idsABorrar) {
    const g = await prisma.gasto.findUnique({ where: { id } });
    if (!g) continue;
    await prisma.gasto.delete({ where: { id } });
    borrados.push(`${g.fecha.toISOString().slice(0, 10)} | ${g.proveedor} | ${g.concepto} | ${g.importe}€`);
  }
  return NextResponse.json({ borrados });
}
