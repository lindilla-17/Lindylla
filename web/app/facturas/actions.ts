"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Alterna el estado de cobro de una factura (Pagada <-> Pendiente).
export async function toggleFacturaPagada(id: string) {
  const factura = await prisma.factura.findUnique({ where: { id } });
  if (!factura) return;

  const pagada = factura.estado === "PAGADA";
  await prisma.factura.update({
    where: { id },
    data: {
      estado: pagada ? "PENDIENTE" : "PAGADA",
      fechaPago: pagada ? null : new Date(),
    },
  });

  // Los totales aparecen en varias páginas: refrescamos todas.
  revalidatePath("/facturas");
  revalidatePath("/finanzas");
  revalidatePath("/");
}

export type LineaFactura = { concepto: string; cantidad: number; precioUnitario: number };

// Siguiente número de la serie del año actual (ej. 2601, 2602... -> 2614)
export async function siguienteNumeroFactura(): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(2); // "26"
  const facturas = await prisma.factura.findMany({ select: { numero: true } });
  let max = 0;
  for (const f of facturas) {
    const m = f.numero.match(/^(\d{4})/); // serie corta YYNN
    if (m && m[1].startsWith(yy)) {
      const n = parseInt(m[1].slice(2));
      if (n > max) max = n;
    }
  }
  return `${yy}${String(max + 1).padStart(2, "0")}`;
}

// Crea una factura desde el formulario y devuelve su id para ir a imprimirla.
export async function crearFactura(input: {
  numero: string;
  empresaId: string;
  fecha: string; // yyyy-mm-dd
  conIva: boolean;
  lineas: LineaFactura[];
  // datos del cliente que se actualizan en su ficha si estaban vacíos
  cif?: string;
  direccion?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const lineas = input.lineas.filter((l) => l.concepto.trim() !== "");
  if (lineas.length === 0) return { ok: false, error: "Añade al menos una línea con concepto." };
  if (!input.numero.trim()) return { ok: false, error: "Falta el número de factura." };

  const existente = await prisma.factura.findUnique({ where: { numero: input.numero.trim() } });
  if (existente) return { ok: false, error: `Ya existe una factura con el número ${input.numero} — los números no deben repetirse.` };

  const neto = Math.round(lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0) * 100) / 100;
  const iva = input.conIva ? Math.round(neto * 0.21 * 100) / 100 : 0;

  // Completar la ficha del cliente si faltan datos
  const empresa = await prisma.empresa.findUnique({ where: { id: input.empresaId } });
  if (!empresa) return { ok: false, error: "Selecciona una empresa." };
  const patch: { cif?: string; direccion?: string } = {};
  if (input.cif?.trim() && !empresa.cif) patch.cif = input.cif.trim();
  if (input.direccion?.trim() && input.direccion.trim() !== (empresa.direccion ?? "")) patch.direccion = input.direccion.trim();
  if (Object.keys(patch).length > 0) {
    await prisma.empresa.update({ where: { id: empresa.id }, data: patch });
  }

  const factura = await prisma.factura.create({
    data: {
      numero: input.numero.trim(),
      empresaId: input.empresaId,
      fecha: new Date(input.fecha),
      estado: "PENDIENTE",
      neto,
      iva,
      total: Math.round((neto + iva) * 100) / 100,
      concepto: lineas.map((l) => l.concepto).join(" + "),
      lineasJson: JSON.stringify(lineas),
      notas: "Creada desde la web",
    },
  });

  revalidatePath("/facturas");
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { ok: true, id: factura.id };
}

// Elimina una factura definitivamente (pensado para pruebas o errores recién creados;
// una factura ya enviada/declarada no se borra: se rectifica).
export async function eliminarFactura(id: string) {
  await prisma.factura.delete({ where: { id } });
  revalidatePath("/facturas");
  revalidatePath("/finanzas");
  revalidatePath("/");
}

// Corrige una factura existente SIN gastar otro número (usar solo si aún no
// se envió al cliente ni se declaró; si ya se envió, lo correcto es una rectificativa).
export async function actualizarFactura(
  id: string,
  input: {
    numero: string;
    empresaId: string;
    fecha: string;
    conIva: boolean;
    lineas: LineaFactura[];
    cif?: string;
    direccion?: string;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const lineas = input.lineas.filter((l) => l.concepto.trim() !== "");
  if (lineas.length === 0) return { ok: false, error: "Añade al menos una línea con concepto." };

  const duplicada = await prisma.factura.findFirst({
    where: { numero: input.numero.trim(), NOT: { id } },
  });
  if (duplicada) return { ok: false, error: `Ya existe otra factura con el número ${input.numero}.` };

  const neto = Math.round(lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0) * 100) / 100;
  const iva = input.conIva ? Math.round(neto * 0.21 * 100) / 100 : 0;

  if (input.direccion?.trim() || input.cif?.trim()) {
    await prisma.empresa.update({
      where: { id: input.empresaId },
      data: {
        ...(input.cif?.trim() ? { cif: input.cif.trim() } : {}),
        ...(input.direccion?.trim() ? { direccion: input.direccion.trim() } : {}),
      },
    });
  }

  await prisma.factura.update({
    where: { id },
    data: {
      numero: input.numero.trim(),
      empresaId: input.empresaId,
      fecha: new Date(input.fecha),
      neto,
      iva,
      total: Math.round((neto + iva) * 100) / 100,
      concepto: lineas.map((l) => l.concepto).join(" + "),
      lineasJson: JSON.stringify(lineas),
    },
  });

  revalidatePath("/facturas");
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { ok: true, id };
}
