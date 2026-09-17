import { prisma } from "@/lib/prisma";
import { convertirPresupuestoEnFactura } from "@/app/facturas/actions";
import { NextResponse } from "next/server";

export async function GET() {
  const empresa = await prisma.empresa.findFirst();
  if (!empresa) return NextResponse.json({ error: "no hay empresas" });

  const presupuesto = await prisma.presupuesto.create({
    data: {
      numero: "P99-TEST-CONVERT",
      empresaId: empresa.id,
      fecha: new Date(),
      estado: "BORRADOR",
      conIva: true,
      lineas: { create: [{ concepto: "Prueba conversión", cantidad: 3, precioUnitario: 10 }] },
    },
  });

  const resultado = await convertirPresupuestoEnFactura(presupuesto.id);

  const facturaCreada = resultado.ok ? await prisma.factura.findUnique({ where: { id: resultado.id } }) : null;
  const presupuestoActualizado = await prisma.presupuesto.findUnique({ where: { id: presupuesto.id } });

  // Limpieza: borramos la prueba (factura primero, por la relación única)
  if (resultado.ok) await prisma.factura.delete({ where: { id: resultado.id } });
  await prisma.presupuesto.delete({ where: { id: presupuesto.id } });

  return NextResponse.json({ resultado, facturaCreada, presupuestoActualizado });
}
