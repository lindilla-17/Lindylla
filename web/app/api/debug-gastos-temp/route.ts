import { crearGasto } from "@/app/gastos/actions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const formData = new FormData();
  formData.set("proveedor", "Prueba devolución");
  formData.set("concepto", "Prueba gasto negativo");
  formData.set("categoria", "GENERAL");
  formData.set("tipo", "SOCIEDAD");
  formData.set("fecha", "2026-10-04");
  formData.set("lineas", JSON.stringify([{ base: -50, pctIva: 21 }]));

  const r = await crearGasto(formData);
  if (!r.ok) return NextResponse.json(r);

  const gasto = await prisma.gasto.findUnique({ where: { id: r.id } });
  await prisma.gasto.delete({ where: { id: r.id } });

  return NextResponse.json({ resultado: r, gasto });
}
