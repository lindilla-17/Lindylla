import { prisma } from "@/lib/prisma";
import { subirGastoLindillaADrive } from "@/lib/googleDrive";
import { NextResponse } from "next/server";

// Ruta temporal de diagnóstico — borrar después de usarla.
export async function GET() {
  const buffer = Buffer.from("prueba desde produccion");
  const resultado = await subirGastoLindillaADrive({
    archivo: buffer,
    nombreArchivo: "PRUEBA-produccion-borrar.txt",
    fecha: new Date(),
    mimeType: "text/plain",
    tipo: "sociedad",
  });
  const gastosSinArchivo = await prisma.gasto.count({ where: { archivo: null, notas: { not: null } } });
  return NextResponse.json({ resultado, gastosSinArchivo });
}
