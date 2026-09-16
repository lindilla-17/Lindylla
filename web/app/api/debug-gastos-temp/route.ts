import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const e = await prisma.empresa.update({
    where: { id: (await prisma.empresa.findFirstOrThrow({ where: { nombre: "Promedwork" } })).id },
    data: {
      nombre: "Promedwork Internacional, Lda",
      direccion: "Rua Dr. Brito Camara nº20, 1º, 9000-039 Funchal - Madeira (Zona Franca da Madeira)",
      cif: "PT510906150",
      pais: "Portugal",
    },
  });
  return NextResponse.json(e);
}
