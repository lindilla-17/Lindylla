"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { subirGastoLindillaADrive } from "@/lib/googleDrive";

// Alterna el estado de pago de un gasto (Pagado <-> Pendiente).
export async function toggleGastoPagado(id: string) {
  const gasto = await prisma.gasto.findUnique({ where: { id } });
  if (!gasto) return;

  const pagado = gasto.estado === "PAGADO";
  await prisma.gasto.update({
    where: { id },
    data: { estado: pagado ? "PENDIENTE" : "PAGADO", fechaPago: pagado ? null : new Date() },
  });

  revalidatePath("/gastos");
  revalidatePath("/finanzas");
  revalidatePath("/");
}

export async function eliminarGasto(id: string) {
  await prisma.gasto.delete({ where: { id } });
  revalidatePath("/gastos");
  revalidatePath("/finanzas");
  revalidatePath("/");
}

// Nombre de archivo legible: "2026-08-24 Proveedor.jpg"
function nombreArchivoGasto(fecha: Date, proveedor: string, concepto: string, extension: string): string {
  const base = (proveedor.trim() || concepto.trim() || "gasto")
    .replace(/[\\/:*?"<>|]/g, "")
    .slice(0, 60);
  const fechaIso = fecha.toISOString().slice(0, 10);
  return `${fechaIso} ${base}.${extension}`;
}

function extensionDe(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "application/pdf") return "pdf";
  return "jpg";
}

// Crea un gasto de Lindilla (gorros) desde el formulario. Si se adjunta una
// foto/archivo del justificante, se sube sola a la carpeta de Drive que
// corresponda (Gastos sociedad / Gastos mios) según el año y trimestre de la
// fecha del gasto. Igual que con las facturas, un fallo al subir a Drive NO
// rompe la creación del gasto: se anota para revisarlo a mano.
export async function crearGasto(formData: FormData): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const proveedor = String(formData.get("proveedor") ?? "").trim();
  const concepto = String(formData.get("concepto") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "GENERAL");
  const tipo = String(formData.get("tipo") ?? "SOCIEDAD");
  const fechaStr = String(formData.get("fecha") ?? "");
  const neto = parseFloat(String(formData.get("neto") ?? "0").replace(",", ".")) || 0;
  const iva = parseFloat(String(formData.get("iva") ?? "0").replace(",", ".")) || 0;
  const archivoFile = formData.get("archivo");

  if (!concepto) return { ok: false, error: "Falta el concepto del gasto." };
  if (!fechaStr) return { ok: false, error: "Falta la fecha." };

  const fecha = new Date(fechaStr);
  const importe = Math.round((neto + iva) * 100) / 100;

  const gasto = await prisma.gasto.create({
    data: {
      concepto,
      categoria,
      tipo,
      proveedor: proveedor || null,
      fecha,
      neto,
      iva,
      importe,
      estado: "PENDIENTE",
    },
  });

  if (archivoFile instanceof File && archivoFile.size > 0) {
    try {
      const buffer = Buffer.from(await archivoFile.arrayBuffer());
      const mimeType = archivoFile.type || "image/jpeg";
      const extension = extensionDe(mimeType);
      const nombreArchivo = nombreArchivoGasto(fecha, proveedor, concepto, extension);

      const resultado = await subirGastoLindillaADrive({
        archivo: buffer,
        nombreArchivo,
        fecha,
        mimeType,
        tipo: tipo === "MIOS" ? "mios" : "sociedad",
      });

      if (resultado.ok) {
        await prisma.gasto.update({ where: { id: gasto.id }, data: { archivo: nombreArchivo } });
      } else {
        await prisma.gasto.update({
          where: { id: gasto.id },
          data: { notas: `No se pudo subir la foto a Drive: ${resultado.error}. Puedes subirla a mano a la carpeta de Gastos de Drive.` },
        });
      }
    } catch (e) {
      console.error("Error guardando justificante de gasto en Drive:", e);
      await prisma.gasto.update({
        where: { id: gasto.id },
        data: { notas: "No se pudo subir la foto a Drive (fallo inesperado). Puedes subirla a mano a la carpeta de Gastos de Drive." },
      });
    }
  }

  revalidatePath("/gastos");
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { ok: true, id: gasto.id };
}
