"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ACTIVIDADES_DEFECTO } from "./trabajos";

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
  revalidatePath("/centroveo/actividades");
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

// Crea las actividades por defecto la primera vez (si no hay ninguna)
export async function asegurarActividades() {
  const n = await prisma.centroveoActividad.count();
  if (n === 0) {
    await prisma.centroveoActividad.createMany({
      data: ACTIVIDADES_DEFECTO.map((a, i) => ({ ...a, precio: 0, orden: i })),
    });
  }
}

// Crea una actividad nueva (facturable o no)
export async function crearActividad(input: {
  nombre: string;
  color: string;
  facturable: boolean;
  precio: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const nombre = input.nombre.trim();
  if (!nombre) return { ok: false, error: "Ponle un nombre a la actividad." };
  const max = await prisma.centroveoActividad.aggregate({ _max: { orden: true } });
  await prisma.centroveoActividad.create({
    data: {
      nombre,
      color: input.color || "#4e8f84",
      facturable: input.facturable,
      precio: input.facturable ? Math.max(0, Math.round((input.precio || 0) * 100) / 100) : 0,
      orden: (max._max.orden ?? 0) + 1,
    },
  });
  refrescar();
  return { ok: true };
}

// Actualiza nombre, color, facturable o precio de una actividad
export async function actualizarActividad(
  id: string,
  input: { nombre: string; color: string; facturable: boolean; precio: number }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const nombre = input.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre no puede quedar vacío." };
  await prisma.centroveoActividad.update({
    where: { id },
    data: {
      nombre,
      color: input.color || "#4e8f84",
      facturable: input.facturable,
      precio: input.facturable ? Math.max(0, Math.round((input.precio || 0) * 100) / 100) : 0,
    },
  });
  refrescar();
  return { ok: true };
}

// Activa/desactiva una actividad (desactivada = no se ofrece para nuevos apuntes,
// pero se conserva el histórico ya apuntado)
export async function toggleActividadActiva(id: string) {
  const a = await prisma.centroveoActividad.findUnique({ where: { id } });
  if (!a) return;
  await prisma.centroveoActividad.update({ where: { id }, data: { activa: !a.activa } });
  refrescar();
}

// Borra una actividad SOLO si no tiene ningún trabajo apuntado
export async function eliminarActividad(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const usos = await prisma.centroveoTrabajo.count({ where: { actividadId: id } });
  if (usos > 0) {
    return { ok: false, error: "Esta actividad ya tiene trabajos apuntados. Puedes desactivarla, pero no borrarla (perderías el histórico)." };
  }
  await prisma.centroveoActividad.delete({ where: { id } });
  refrescar();
  return { ok: true };
}

// Apunta un trabajo en un día del calendario
export async function apuntarTrabajo(input: {
  fecha: string; // yyyy-mm-dd
  actividadId: string;
  cantidad: number;
  notas?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const act = await prisma.centroveoActividad.findUnique({ where: { id: input.actividadId } });
  if (!act) return { ok: false, error: "Actividad no válida." };
  const cantidad = Math.floor(input.cantidad);
  if (!(cantidad > 0)) return { ok: false, error: "La cantidad debe ser 1 o más." };

  // Guardamos la fecha a mediodía para evitar líos de zona horaria
  await prisma.centroveoTrabajo.create({
    data: {
      fecha: new Date(`${input.fecha}T12:00:00`),
      actividadId: input.actividadId,
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

// Genera la factura profesional de un mes: suma el trabajo pendiente de las
// actividades FACTURABLES (cantidad × precio) en una CentroveoFactura tipo
// PROFESIONAL, exenta de IVA, y enlaza esos apuntes a la factura.
// Las actividades no facturables se quedan en la agenda como registro, sin cobrarse.
export async function facturarMes(
  mes: string // "yyyy-mm"
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const [y, m] = mes.split("-").map(Number);
  if (!y || !m) return { ok: false, error: "Mes no válido." };
  const desde = new Date(y, m - 1, 1);
  const hasta = new Date(y, m, 1);

  const trabajos = await prisma.centroveoTrabajo.findMany({
    where: { facturaId: null, fecha: { gte: desde, lt: hasta }, actividad: { facturable: true } },
    include: { actividad: true },
  });
  if (trabajos.length === 0) return { ok: false, error: "No hay trabajo facturable pendiente en ese mes." };

  // Agrupa por actividad
  const grupos = new Map<string, { nombre: string; precio: number; uds: number }>();
  for (const t of trabajos) {
    const g = grupos.get(t.actividadId) ?? { nombre: t.actividad.nombre, precio: t.actividad.precio, uds: 0 };
    g.uds += t.cantidad;
    grupos.set(t.actividadId, g);
  }

  if ([...grupos.values()].every((g) => g.precio === 0)) {
    return { ok: false, error: "Los precios de las actividades facturables están a 0 €. Ponlos antes de facturar el mes." };
  }

  const neto = Math.round([...grupos.values()].reduce((s, g) => s + g.uds * g.precio, 0) * 100) / 100;
  const partes = [...grupos.values()].map((g) => `${g.uds} × ${g.nombre}`).join(", ");
  const nombreMes = desde.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const numero = await siguienteNumeroCentroveo();

  const factura = await prisma.centroveoFactura.create({
    data: {
      numero,
      tipo: "PROFESIONAL",
      cliente: "Hospital Vithas Xanit",
      concepto: `Trabajos profesionales de optometría — ${nombreMes}: ${partes}`,
      fecha: hasta > new Date() ? new Date() : new Date(y, m, 0),
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
