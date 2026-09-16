import { prisma } from "@/lib/prisma";
import { generarPresupuestoPdf } from "@/lib/presupuestoPdf";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.presupuesto.findUnique({ where: { id }, include: { empresa: true, lineas: true } });
  if (!p) return new NextResponse("No encontrado", { status: 404 });

  const neto = p.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const iva = p.conIva ? neto * 0.21 : 0;
  const total = neto + iva;

  const pdf = await generarPresupuestoPdf({
    fecha: p.fecha,
    clienteNombre: p.empresa.nombre,
    clienteDireccion: p.empresa.direccion,
    clienteCif: p.empresa.cif,
    lineas: p.lineas.map((l) => ({ concepto: l.concepto, cantidad: l.cantidad, precioUnitario: l.precioUnitario })),
    neto,
    iva,
    total,
    adelantoPct: p.adelantoPct,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // "inline" (no "attachment"): en el móvil se abre en el visor de PDF de
      // Safari, que tiene su propio botón de compartir arriba. Con
      // "attachment" se forzaba la descarga y no había forma de compartirlo.
      "Content-Disposition": `inline; filename="Presupuesto ${p.empresa.nombre} ${p.fecha.toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
