"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================
// Acciones de CENTROVEO (actividad sanitaria de Lindilla S.L.)
// Totalmente independientes de la actividad de gorros: solo
// tocan las tablas CentroveoFactura y CentroveoGasto.
// ============================================================

// Refresca las páginas de Centroveo donde aparecen totales
function refrescar() {
  revalidatePath("/centroveo");
  revalidatePath("/centroveo/emitidas");
  revalidatePath("/centroveo/profesionales");
  revalidatePath("/centroveo/proveedores");
  revalidatePath("/");
}

// Sugiere el siguiente número de la serie del año (CV-26-001, CV-26-002...)
// La serie es común a lentes y servicios; el número siempre es editable.
export async function siguienteNumeroCentroveo(): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(2);
  const prefijo = `CV-${yy}-`;
  const facturas = await prisma.centroveoFactura.findMany({ select: { numero: true } });
  let max = 0;
  for (const f of facturas) {
    if (f.numero.startsWith(prefijo)) {
      const n = parseInt(f.numero.slice(prefijo.length));
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return `${prefijo}${String(max + 1).padStart(3, "0")}`;
}

// Crea una factura emitida de Centroveo.
// El IVA lo fija el tipo (regla de negocio, no editable):
//  - LENTES: 10% (venta de lentes de contacto)
//  - PROFESIONAL: exenta (servicios sanitarios, art. 20 LIVA)
export async function crearCentroveoFactura(input: {
  numero: string;
  tipo: "LENTES" | "PROFESIONAL";
  cliente: string;
  concepto: string;
  fecha: string; // yyyy-mm-dd
  neto: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.numero.trim()) return { ok: false, error: "Falta el número de factura." };
  if (!input.cliente.trim()) return { ok: false, error: "Falta el cliente." };
  if (!(input.neto > 0)) return { ok: false, error: "El importe (base) debe ser mayor que 0." };

  const existente = await prisma.centroveoFactura.findUnique({ where: { numero: input.numero.trim() } });
  if (existente) return { ok: false, error: `Ya existe una factura Centroveo con el número ${input.numero}.` };

  const neto = Math.round(input.neto * 100) / 100;
  const iva = input.tipo === "LENTES" ? Math.round(neto * 0.1 * 100) / 100 : 0;

  await prisma.centroveoFactura.create({
    data: {
      numero: input.numero.trim(),
      tipo: input.tipo,
      cliente: input.cliente.trim(),
      concepto: input.concepto.trim() || null,
      fecha: new Date(input.fecha),
      estado: "PENDIENTE",
      neto,
      iva,
      total: Math.round((neto + iva) * 100) / 100,
      notas:
        input.tipo === "PROFESIONAL"
          ? "Exenta de IVA: servicios sanitarios (art. 20 LIVA)"
          : null,
    },
  });

  refrescar();
  return { ok: true };
}

// Alterna cobrada <-> pendiente
export async function toggleCentroveoFacturaPagada(id: string) {
  const f = await prisma.centroveoFactura.findUnique({ where: { id } });
  if (!f) return;
  const pagada = f.estado === "PAGADA";
  await prisma.centroveoFactura.update({
    where: { id },
    data: { estado: pagada ? "PENDIENTE" : "PAGADA", fechaPago: pagada ? null : new Date() },
  });
  refrescar();
}

// Borra una factura (para errores recién creados; una declarada se rectifica)
export async function eliminarCentroveoFactura(id: string) {
  await prisma.centroveoFactura.delete({ where: { id } });
  refrescar();
}

// Crea una factura de proveedor (gasto de Centroveo)
export async function crearCentroveoGasto(input: {
  proveedor: string;
  concepto: string;
  fecha: string;
  neto: number;
  iva: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.proveedor.trim()) return { ok: false, error: "Falta el proveedor." };
  if (!input.concepto.trim()) return { ok: false, error: "Falta el concepto." };
  if (!(input.neto > 0)) return { ok: false, error: "La base imponible debe ser mayor que 0." };
  if (input.iva < 0) return { ok: false, error: "El IVA no puede ser negativo." };

  const neto = Math.round(input.neto * 100) / 100;
  const iva = Math.round(input.iva * 100) / 100;

  await prisma.centroveoGasto.create({
    data: {
      proveedor: input.proveedor.trim(),
      concepto: input.concepto.trim(),
      fecha: new Date(input.fecha),
      neto,
      iva,
      importe: Math.round((neto + iva) * 100) / 100,
      estado: "PENDIENTE",
    },
  });

  refrescar();
  return { ok: true };
}

// Alterna pagado <-> pendiente
export async function toggleCentroveoGastoPagado(id: string) {
  const g = await prisma.centroveoGasto.findUnique({ where: { id } });
  if (!g) return;
  const pagado = g.estado === "PAGADO";
  await prisma.centroveoGasto.update({
    where: { id },
    data: { estado: pagado ? "PENDIENTE" : "PAGADO", fechaPago: pagado ? null : new Date() },
  });
  refrescar();
}

// Borra un gasto de proveedor
export async function eliminarCentroveoGasto(id: string) {
  await prisma.centroveoGasto.delete({ where: { id } });
  refrescar();
}
