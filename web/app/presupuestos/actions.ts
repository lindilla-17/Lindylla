"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type LineaPresupuestoInput = { concepto: string; cantidad: number; precioUnitario: number };

// Número interno del presupuesto (no aparece impreso: los presupuestos no
// llevan numeración fiscal como las facturas). Sirve solo para identificarlo
// en el listado y para que el campo "numero" único de la base de datos
// tenga un valor.
async function siguienteNumeroPresupuesto(): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(2);
  const todos = await prisma.presupuesto.findMany({ select: { numero: true } });
  let max = 0;
  for (const p of todos) {
    const m = p.numero.match(/^P(\d{2})(\d+)$/);
    if (m && m[1] === yy) {
      const n = parseInt(m[2]);
      if (n > max) max = n;
    }
  }
  return `P${yy}${String(max + 1).padStart(2, "0")}`;
}

// Crea un presupuesto (documento informativo, sin numeración fiscal) para un
// pedido de gorros. A diferencia de una factura, puede no llevar IVA (útil
// para clientes de fuera de España a los que no siempre se factura).
export async function crearPresupuesto(input: {
  empresaId: string;
  fecha: string; // yyyy-mm-dd
  conIva: boolean;
  adelantoPct: number | null;
  lineas: LineaPresupuestoInput[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const lineas = input.lineas.filter((l) => l.concepto.trim() !== "");
  if (lineas.length === 0) return { ok: false, error: "Añade al menos una línea con concepto." };

  const empresa = await prisma.empresa.findUnique({ where: { id: input.empresaId } });
  if (!empresa) return { ok: false, error: "Selecciona una empresa." };

  const numero = await siguienteNumeroPresupuesto();

  const presupuesto = await prisma.presupuesto.create({
    data: {
      numero,
      empresaId: input.empresaId,
      fecha: new Date(input.fecha),
      estado: "BORRADOR",
      conIva: input.conIva,
      adelantoPct: input.adelantoPct,
      lineas: {
        create: lineas.map((l) => ({
          concepto: l.concepto,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
        })),
      },
    },
  });

  revalidatePath("/presupuestos");
  revalidatePath("/facturas");
  return { ok: true, id: presupuesto.id };
}

export async function eliminarPresupuesto(id: string) {
  await prisma.presupuesto.delete({ where: { id } });
  revalidatePath("/presupuestos");
}
