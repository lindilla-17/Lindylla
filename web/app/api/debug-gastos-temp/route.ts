import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [actividades, config] = await Promise.all([
    prisma.centroveoActividad.findMany({ orderBy: { orden: "asc" } }),
    prisma.centroveoConfig.findUnique({ where: { id: "config" } }),
  ]);
  return NextResponse.json({ actividades, config });
}
