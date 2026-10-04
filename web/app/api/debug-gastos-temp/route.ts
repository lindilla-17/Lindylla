import { crearGasto } from "@/app/gastos/actions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const formData = new FormData();
  formData.set("proveedor", "Prueba IVA mixto");
  formData.set("concepto", "Prueba renglones IVA");
  formData.set("categoria", "GENERAL");
  formData.set("tipo", "SOCIEDAD");
  formData.set("fecha", "2026-10-04");
  formData.set("lineas", JSON.stringify([{ base: 16.53, pctIva: 21 }, { base: 3.63, pctIva: 10 }]));

  const r = await crearGasto(formData);
  if (!r.ok) return NextResponse.json(r);

  const gasto = await prisma.gasto.findUnique({ where: { id: r.id } });
  await prisma.gasto.delete({ where: { id: r.id } });

  return NextResponse.json({ resultado: r, gasto });
}
