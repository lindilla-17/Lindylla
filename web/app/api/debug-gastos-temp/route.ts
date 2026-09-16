import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const empresa = await prisma.empresa.findFirst({ where: { nombre: { contains: "Polonia" } } });
  if (!empresa) return NextResponse.json({ error: "no existe empresa Polonia" });

  const facturas = await prisma.factura.findMany({ where: { empresaId: empresa.id }, orderBy: { fecha: "asc" } });
  const presupuestos = await prisma.presupuesto.findMany({ where: { empresaId: empresa.id }, orderBy: { fecha: "asc" } });

  return NextResponse.json({
    empresa: { nombre: empresa.nombre, carpeta: empresa.carpeta },
    facturas: facturas.map((f) => ({ numero: f.numero, fecha: f.fecha.toISOString().slice(0, 10), total: f.total, archivo: f.archivo, estado: f.estado })),
    presupuestos: presupuestos.map((p) => ({ numero: p.numero, fecha: p.fecha.toISOString().slice(0, 10) })),
  });
}
