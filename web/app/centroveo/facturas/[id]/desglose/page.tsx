import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CentroveoPrintBar } from "@/components/CentroveoPrintBar";

export const dynamic = "force-dynamic";

// Documento informativo (NO es la factura fiscal) que explica de dónde sale el
// importe de una factura de servicios profesionales: cuántas unidades de cada
// actividad y su precio. Se genera y se enseña aparte de la factura oficial,
// que lleva un concepto único ("Servicios profesionales").
const euro = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fechaLarga = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

type Linea = { concepto: string; cantidad: number; precioUnitario: number };

export default async function DesgloseCentroveoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await prisma.centroveoFactura.findUnique({ where: { id } });
  if (!f) notFound();

  let lineas: Linea[] = [];
  if (f.lineasJson) {
    try {
      const parsed = JSON.parse(f.lineasJson);
      if (Array.isArray(parsed)) lineas = parsed;
    } catch {
      lineas = [];
    }
  }

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-8 py-6">
      <CentroveoPrintBar volverA={`/centroveo/facturas/${f.id}/imprimir`} />

      <div className="factura-hoja bg-white text-[#16211e] rounded-xl border border-[var(--border)] shadow-sm px-8 sm:px-12 py-10 print:border-0 print:shadow-none print:rounded-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-serif tracking-tight">Desglose del importe facturado</h1>
            <p className="muted text-[13px] mt-1">Factura {f.numero} · {fechaLarga(f.fecha)} · {f.cliente}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/centroveo.png" alt="Centroveo" className="h-14 w-auto" />
        </div>

        <div className="mt-3 inline-block rounded-lg bg-[#fdf3e2] border border-[#e9c98a] px-3 py-2 text-[12px] text-[#8a5a12]">
          Documento informativo interno — no sustituye a la factura fiscal {f.numero}, que lleva concepto único (&quot;Servicios profesionales&quot;).
        </div>

        <table className="w-full mt-6 text-[13px]">
          <thead>
            <tr className="border-y-2 border-[#16211e]">
              <th className="text-left py-2 font-semibold">CONCEPTO</th>
              <th className="text-right py-2 font-semibold w-[60px]">UDS.</th>
              <th className="text-right py-2 font-semibold w-[100px]">P. UNIDAD</th>
              <th className="text-right py-2 font-semibold w-[120px]">IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            {lineas.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center muted">No hay desglose guardado para esta factura.</td>
              </tr>
            ) : (
              lineas.map((l, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[#faf7f2]" : ""}>
                  <td className="py-2.5 px-1">{l.concepto}</td>
                  <td className="py-2.5 px-1 text-right">{l.cantidad}</td>
                  <td className="py-2.5 px-1 text-right">{euro(l.precioUnitario)}</td>
                  <td className="py-2.5 px-1 text-right">{euro(l.cantidad * l.precioUnitario)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex justify-end mt-6">
          <div className="w-[280px] text-[13px]">
            <div className="flex justify-between items-center border-t-2 border-[#16211e] pt-2">
              <span className="font-bold text-[15px] text-[#c96f00]">TOTAL FACTURADO</span>
              <span className="font-bold text-[19px] text-[#c96f00]">{euro(f.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
