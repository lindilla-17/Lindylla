import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const empresas = await prisma.empresa.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(empresas.map((e) => ({ nombre: e.nombre, carpeta: e.carpeta })));
}
