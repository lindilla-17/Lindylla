import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const datos = [
    { nombre: "Promedwork", carpeta: "Promedwork" },
    { nombre: "Lopez Marin", carpeta: "lopez marin" },
    { nombre: "Teresa Sagrario", carpeta: "teresa sagrario" },
  ];
  const creadas = [];
  for (const d of datos) {
    const existe = await prisma.empresa.findFirst({ where: { nombre: d.nombre } });
    if (existe) continue;
    const e = await prisma.empresa.create({ data: { nombre: d.nombre, carpeta: d.carpeta, tipo: "MATRIZ" } });
    creadas.push(e.nombre);
  }
  return NextResponse.json({ creadas });
}
