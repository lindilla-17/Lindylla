import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const e = await prisma.empresa.update({
    where: { id: (await prisma.empresa.findFirstOrThrow({ where: { nombre: { contains: "Polonia" } } })).id },
    data: { carpeta: "Bausch Polonia" },
  });
  return NextResponse.json({ nombre: e.nombre, carpeta: e.carpeta });
}
