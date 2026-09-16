import { prisma } from "@/lib/prisma";
import { generarPresupuestoPdf } from "@/lib/presupuestoPdf";
import { NextResponse } from "next/server";

export async function GET() {
  const pdf = await generarPresupuestoPdf({
    fecha: new Date(),
    clienteNombre: "Promedwork Internacional, Lda",
    clienteDireccion: "Rua Dr. Brito Camara nº20, 1º, 9000-039 Funchal - Madeira (Zona Franca da Madeira)",
    clienteCif: "PT510906150",
    lineas: [{ concepto: "Gorros quirófano personalizados", cantidad: 200, precioUnitario: 6 }],
    neto: 1200,
    iva: 0,
    total: 1200,
    adelantoPct: 40,
  });
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf" } });
}
