import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const empresas = await prisma.empresa.findMany({
    where: {
      OR: [
        { nombre: { contains: "promed", mode: "insensitive" } },
        { nombre: { contains: "lopez", mode: "insensitive" } },
        { nombre: { contains: "López", mode: "insensitive" } },
        { nombre: { contains: "marin", mode: "insensitive" } },
        { nombre: { contains: "marín", mode: "insensitive" } },
        { nombre: { contains: "teresa", mode: "insensitive" } },
        { nombre: { contains: "sagrario", mode: "insensitive" } },
        { carpeta: { contains: "promed", mode: "insensitive" } },
        { carpeta: { contains: "lopez", mode: "insensitive" } },
        { carpeta: { contains: "marin", mode: "insensitive" } },
        { carpeta: { contains: "teresa", mode: "insensitive" } },
        { carpeta: { contains: "sagrario", mode: "insensitive" } },
      ],
    },
  });
  const total = await prisma.empresa.count();
  return NextResponse.json({ total, coincidencias: empresas.map((e) => ({ nombre: e.nombre, carpeta: e.carpeta })) });
}
