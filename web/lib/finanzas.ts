import { prisma } from "./prisma";

export type ResumenAnual = {
  year: number;
  ingresos: number; // facturado en el año, base sin IVA (el IVA no es ingreso: se liquida a Hacienda)
  iva: number; // IVA repercutido en el año
  cobrado: number; // facturas pagadas (total con IVA)
  gastos: number;
  rentabilidad: number; // ingresos (sin IVA) - gastos
  margen: number; // rentabilidad / ingresos
};

// Rentabilidad por año (ingresos facturados - gastos), ordenado ascendente.
export async function getResumenAnual(): Promise<ResumenAnual[]> {
  const [facturas, gastos] = await Promise.all([
    prisma.factura.findMany(),
    prisma.gasto.findMany(),
  ]);

  const porAno = new Map<number, ResumenAnual>();
  const ensure = (year: number) => {
    if (!porAno.has(year))
      porAno.set(year, { year, ingresos: 0, iva: 0, cobrado: 0, gastos: 0, rentabilidad: 0, margen: 0 });
    return porAno.get(year)!;
  };

  for (const f of facturas) {
    const r = ensure(f.fecha.getFullYear());
    r.ingresos += f.neto;
    r.iva += f.iva;
    if (f.estado === "PAGADA") r.cobrado += f.total;
  }
  for (const g of gastos) {
    const r = ensure(g.fecha.getFullYear());
    r.gastos += g.importe;
  }

  const lista = [...porAno.values()].sort((a, b) => a.year - b.year);
  for (const r of lista) {
    r.rentabilidad = r.ingresos - r.gastos;
    r.margen = r.ingresos > 0 ? r.rentabilidad / r.ingresos : 0;
  }
  return lista;
}

// Importes pendientes: por cobrar (facturas no pagadas) y por pagar (gastos no pagados).
export async function getPendientes() {
  const [facturasPend, gastosPend] = await Promise.all([
    prisma.factura.findMany({
      where: { estado: "PENDIENTE" },
      include: { empresa: true },
      orderBy: { fechaVencimiento: "asc" },
    }),
    prisma.gasto.findMany({
      where: { estado: "PENDIENTE" },
      orderBy: { fechaVencimiento: "asc" },
    }),
  ]);

  const porCobrar = facturasPend.reduce((s, f) => s + f.total, 0);
  const porPagar = gastosPend.reduce((s, g) => s + g.importe, 0);

  return { porCobrar, porPagar, facturasPend, gastosPend };
}
