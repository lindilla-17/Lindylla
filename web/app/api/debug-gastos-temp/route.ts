import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const cambios: string[] = [];

  // 1) Factura 20128 (21% ya metida con la foto equivocada): corregir el archivo
  await prisma.gasto.update({
    where: { id: "cmuu6n7i30003k4043tbyo2t8" },
    data: { archivo: "2026-09-15 Viveros guzman.jpg" },
  });
  cambios.push("Corregida foto de la línea 21% de la factura 20128 (120,00€)");

  // 2) Factura 20128, parte al 10% (faltaba)
  await prisma.gasto.create({
    data: {
      concepto: "Decoración (10% IVA, fra. 20128)",
      categoria: "GENERAL",
      tipo: "SOCIEDAD",
      proveedor: "Viveros Guzmán",
      fecha: new Date("2026-09-15"),
      neto: 43.09,
      iva: 4.31,
      importe: 47.4,
      estado: "PENDIENTE",
      archivo: "2026-09-15 Viveros guzman.jpg",
    },
  });
  cambios.push("Añadida parte 10% de la factura 20128 (47,40€)");

  // 3) Factura 20129, parte al 21% (faltaba) — la parte al 10% ya estaba bien
  await prisma.gasto.create({
    data: {
      concepto: "Decoración (21% IVA, fra. 20129)",
      categoria: "GENERAL",
      tipo: "SOCIEDAD",
      proveedor: "Viveros Guzmán",
      fecha: new Date("2026-09-15"),
      neto: 12.27,
      iva: 2.58,
      importe: 14.85,
      estado: "PENDIENTE",
      archivo: "2026-09-15 Viveros Guzmán.jpg",
    },
  });
  cambios.push("Añadida parte 21% de la factura 20129 (14,85€)");

  // 4) Corregir Galp: neto estaba puesto como el total con IVA (20) en vez de
  // la base (16,53), y faltaba la segunda línea al 10% (producto ORBIT BOX)
  await prisma.gasto.update({
    where: { id: "cmuu6wms40009k404g0k6uh7o" },
    data: { neto: 16.53, iva: 3.47, importe: 20.0 },
  });
  cambios.push("Corregida base imponible de la gasolina Galp (21%): 20,00€ con IVA incluido");

  await prisma.gasto.create({
    data: {
      concepto: "Orbit Box (10% IVA)",
      categoria: "GASOLINA",
      tipo: "SOCIEDAD",
      proveedor: "Galp",
      fecha: new Date("2026-09-21"),
      neto: 3.63,
      iva: 0.36,
      importe: 3.99,
      estado: "PENDIENTE",
      archivo: "2026-09-21 Galp.jpg",
    },
  });
  cambios.push("Añadida parte 10% de Galp (Orbit Box, 3,99€)");

  return NextResponse.json({ cambios });
}
