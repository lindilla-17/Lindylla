import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CentroveoPrintBar } from "@/components/CentroveoPrintBar";

export const dynamic = "force-dynamic";

// Misma plantilla que las facturas de Lindilla, pero con el logo y los datos de Centroveo.
const euro = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fechaLarga = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

type Linea = { concepto: string; cantidad: number; precioUnitario: number };

// CIF de clientes habituales de Centroveo (dirección aún pendiente de confirmar)
const CIF_CLIENTE: Record<string, string> = {
  "Cilveti Lapeira S.L.": "B-93092922",
};

export default async function ImprimirCentroveoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await prisma.centroveoFactura.findUnique({ where: { id } });
  if (!f) notFound();

  const volverA = f.tipo === "PROFESIONAL" ? "/centroveo/profesionales" : "/centroveo/emitidas";
  const tasaIva = f.neto > 0 ? Math.round((f.iva / f.neto) * 100) : 0;
  const cifCliente = CIF_CLIENTE[f.cliente];

  // La factura oficial siempre lleva un concepto único ("Servicios profesionales" en las
  // de optometría). El desglose por actividad (si existe) se consulta aparte, en
  // /centroveo/facturas/[id]/desglose — no se imprime aquí.
  const lineas: Linea[] = [
    { concepto: f.concepto || "Servicios profesionales", cantidad: 1, precioUnitario: f.neto },
  ];
  const tieneDesglose = !!f.lineasJson;

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-8 py-6">
      <CentroveoPrintBar
        volverA={volverA}
        enlaceExtra={tieneDesglose ? { href: `/centroveo/facturas/${f.id}/desglose`, label: "Ver desglose por conceptos" } : undefined}
      />

      {/* --- Hoja de factura --- */}
      <div className="factura-hoja bg-white text-[#16211e] rounded-xl border border-[var(--border)] shadow-sm px-8 sm:px-12 py-10 print:border-0 print:shadow-none print:rounded-none">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-serif tracking-tight">Factura {f.numero}</h1>
            <div className="border-t-4 border-[#16211e] w-[280px] sm:w-[420px] mt-1 mb-2" />
            <div className="text-[13px]">{fechaLarga(f.fecha)}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/centroveo.png" alt="Centroveo" className="h-16 w-auto" />
        </div>

        {/* Emisor / cliente */}
        <div className="flex justify-between gap-6 mt-8 text-[13px] leading-relaxed">
          <div>
            <div className="muted-2 text-[11px] uppercase tracking-wide mb-1">Cliente</div>
            <div className="font-bold">{f.cliente}</div>
            {cifCliente && <div>CIF: {cifCliente}</div>}
          </div>
          <div className="text-right">
            <div className="font-bold">Lindilla S.L. (Centroveo)</div>
            <div>C/ Poeta Mª Carlota Rodríguez 31</div>
            <div>29190 Málaga</div>
            <div className="font-bold">NIF B23872617</div>
            <div className="mt-1">Mercedes Marcos Ferrando</div>
            <div>NIF 25665063F</div>
          </div>
        </div>

        {/* Líneas: un servicio por renglón */}
        <table className="w-full mt-8 text-[13px]">
          <thead>
            <tr className="border-y-2 border-[#16211e]">
              <th className="text-left py-2 font-semibold">CONCEPTO</th>
              <th className="text-right py-2 font-semibold w-[60px]">UDS.</th>
              <th className="text-right py-2 font-semibold w-[100px]">P. UNIDAD</th>
              <th className="text-right py-2 font-semibold w-[120px]">IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-[#faf7f2]" : ""}>
                <td className="py-2.5 px-1">{l.concepto}</td>
                <td className="py-2.5 px-1 text-right">{l.cantidad}</td>
                <td className="py-2.5 px-1 text-right">{euro(l.precioUnitario)}</td>
                <td className="py-2.5 px-1 text-right">{euro(l.cantidad * l.precioUnitario)}</td>
              </tr>
            ))}
            {lineas.length < 3 &&
              Array.from({ length: 3 - lineas.length }).map((_, i) => (
                <tr key={`v${i}`} className={(lineas.length + i) % 2 === 0 ? "bg-[#faf7f2]" : ""}>
                  <td className="py-2.5">&nbsp;</td><td /><td /><td />
                </tr>
              ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end mt-6">
          <div className="w-[280px] text-[13px]">
            <div className="flex justify-between py-1">
              <span className="text-[#5b6b66]">Base</span>
              <span>{euro(f.neto)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#5b6b66]">{f.iva !== 0 ? `IVA (${tasaIva}%)` : "IVA (exenta)"}</span>
              <span>{euro(f.iva)}</span>
            </div>
            <div className="flex justify-between items-center border-t-2 border-[#16211e] mt-2 pt-2">
              <span className="font-bold text-[15px] text-[#c96f00]">€ TOTAL</span>
              <span className="font-bold text-[19px] text-[#c96f00]">{euro(f.total)}</span>
            </div>
          </div>
        </div>

        {f.iva === 0 && (
          <div className="mt-4 text-[11px] text-[#5b6b66]">
            Operación exenta de IVA — servicios sanitarios (art. 20 LIVA).
          </div>
        )}

        {/* Pie: pago e información (mismos datos bancarios que las facturas de Lindilla) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12 pt-6 border-t border-[#d9d2c7] text-[12px] leading-relaxed">
          <div>
            <div className="font-serif text-[13px] text-[#c96f00] mb-2">DETALLES DEL PAGO</div>
            <div>Nombre del beneficiario: Lindilla S.L.</div>
            <div>Nombre del banco: Banco Santander</div>
            <div>Número de cuenta: ES05 0049 4394 2227 1007 1254</div>
          </div>
          <div className="sm:text-right">
            <div className="font-serif text-[13px] text-[#c96f00] mb-2">INFORMACIÓN ADICIONAL</div>
            <div>Mercedes Marcos Ferrando</div>
            <div>Óptica y optometría · Centroveo</div>
            {f.notas && <div className="mt-1 text-[#5b6b66]">{f.notas}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
