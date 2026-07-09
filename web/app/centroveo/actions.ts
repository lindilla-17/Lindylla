"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TRABAJOS, etiquetaCantidad, type TipoTrabajo } from "./trabajos";

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
  revalidatePath("/centroveo/agenda");
  revalidatePath("/centroveo/tarifas");
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

// ============================================================
// AGENDA de trabajo profesional (calendario → facturas profesionales)
// ============================================================

// Asegura que existen las 3 tarifas (a 0 € hasta que Mercedes las rellene)
export async function asegurarTarifas() {
  for (const tipo of Object.keys(TRABAJOS)) {
    await prisma.centroveoTarifa.upsert({
      where: { tipo },
      create: { tipo, precio: 0 },
      update: {},
    });
  }
}

// Guarda los precios por tipo de trabajo
export async function guardarTarifas(precios: { tipo: string; precio: number }[]) {
  for (const p of precios) {
    const precio = Math.max(0, Math.round((p.precio || 0) * 100) / 100);
    await prisma.centroveoTarifa.upsert({
      where: { tipo: p.tipo },
      create: { tipo: p.tipo, precio },
      update: { precio },
    });
  }
  refrescar();
  return { ok: true as const };
}

// Apunta un trabajo en un día del calendario
export async function apuntarTrabajo(input: {
  fecha: string; // yyyy-mm-dd
  tipo: TipoTrabajo;
  cantidad: number;
  notas?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!TRABAJOS[input.tipo]) return { ok: false, error: "Tipo de trabajo no válido." };
  const cantidad = Math.floor(input.cantidad);
  if (!(cantidad > 0)) return { ok: false, error: "La cantidad debe ser 1 o más." };

  // Guardamos la fecha a mediodía para evitar líos de zona horaria
  await prisma.centroveoTrabajo.create({
    data: {
      fecha: new Date(`${input.fecha}T12:00:00`),
      tipo: input.tipo,
      cantidad,
      notas: input.notas?.trim() || null,
    },
  });
  refrescar();
  return { ok: true };
}

// Borra un apunte (solo si aún no se ha facturado)
export async function eliminarTrabajo(id: string) {
  const t = await prisma.centroveoTrabajo.findUnique({ where: { id } });
  if (!t || t.facturaId) return; // no se borra lo ya facturado
  await prisma.centroveoTrabajo.delete({ where: { id } });
  refrescar();
}

// Genera la factura profesional de un mes: suma el trabajo pendiente
// (cantidad × tarifa) en una CentroveoFactura tipo PROFESIONAL, exenta de IVA,
// y enlaza esos apuntes a la factura para que no se vuelvan a facturar.
export async function facturarMes(
  mes: string // "yyyy-mm"
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const [y, m] = mes.split("-").map(Number);
  if (!y || !m) return { ok: false, error: "Mes no válido." };
  const desde = new Date(y, m - 1, 1);
  const hasta = new Date(y, m, 1);

  const trabajos = await prisma.centroveoTrabajo.findMany({
    where: { facturaId: null, fecha: { gte: desde, lt: hasta } },
  });
  if (trabajos.length === 0) return { ok: false, error: "No hay trabajo pendiente de facturar en ese mes." };

  const tarifas = await prisma.centroveoTarifa.findMany();
  const precioDe = (tipo: string) => tarifas.find((t) => t.tipo === tipo)?.precio ?? 0;

  // Totales por tipo
  const cont: Record<string, number> = {};
  for (const t of trabajos) cont[t.tipo] = (cont[t.tipo] ?? 0) + t.cantidad;

  if (Object.keys(cont).every((tipo) => precioDe(tipo) === 0)) {
    return { ok: false, error: "Los precios de los trabajos están a 0 €. Pon las tarifas antes de facturar el mes." };
  }

  const neto =
    Math.round(
      Object.entries(cont).reduce((s, [tipo, uds]) => s + uds * precioDe(tipo), 0) * 100
    ) / 100;

  const partes = Object.entries(cont)
    .map(([tipo, uds]) => etiquetaCantidad(tipo as TipoTrabajo, uds))
    .join(", ");
  const nombreMes = desde.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const numero = await siguienteNumeroCentroveo();

  const factura = await prisma.centroveoFactura.create({
    data: {
      numero,
      tipo: "PROFESIONAL",
      cliente: "Hospital Vithas Xanit",
      concepto: `Trabajos profesionales de optometría — ${nombreMes}: ${partes}`,
      fecha: hasta > new Date() ? new Date() : new Date(y, m, 0), // último día del mes (o hoy si es el mes en curso)
      estado: "PENDIENTE",
      neto,
      iva: 0,
      total: neto,
      notas: "Exenta de IVA: servicios sanitarios (art. 20 LIVA). Generada desde la agenda.",
    },
  });

  await prisma.centroveoTrabajo.updateMany({
    where: { id: { in: trabajos.map((t) => t.id) } },
    data: { facturaId: factura.id },
  });

  refrescar();
  return { ok: true, id: factura.id };
}
