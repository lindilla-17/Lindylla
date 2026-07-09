import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrintBar } from "@/components/PrintBar";

export const dynamic = "force-dynamic";

// Formato con punto de millar siempre (como en las facturas originales: 7.500,00 €)
const euro = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fechaLarga = (d: Date) =>
  d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

type Linea = { concepto: string; cantidad: number; precioUnitario: number };
type Parcial = { etiqueta: string; importe: number };

// lineasJson puede ser un array de líneas, o { lineas, parcial } en facturas de adelanto/resto
function parseLineas(json: string | null, fallback: Linea): { lineas: Linea[]; parcial: Parcial | null } {
  if (!json) return { lineas: [fallback], parcial: null };
  const data = JSON.parse(json);
  if (Array.isArray(data)) return { lineas: data, parcial: null };
  return { lineas: data.lineas ?? [fallback], parcial: data.parcial ?? null };
}

export default async function ImprimirFacturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await prisma.factura.findUnique({ where: { id }, include: { empresa: true } });
  if (!f) notFound();

  const { lineas, parcial } = parseLineas(f.lineasJson, {
    concepto: f.concepto ?? "Gorros quirófano personalizados",
    cantidad: 1,
    precioUnitario: f.neto,
  });

  // En facturas parciales las líneas describen el pedido completo; el total neto sale de las líneas
  const netoLineas = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const netoMostrar = parcial ? netoLineas : f.neto;
  const totalMostrar = parcial ? netoLineas + f.iva : f.total;

  return (
    <div className="max-w-[820px] mx-auto px-8 py-6">
      <PrintBar facturaId={f.id} />

      {/* --- Hoja de factura --- */}
      <div className="factura-hoja bg-white text-[#16211e] rounded-xl border border-[var(--border)] shadow-sm px-12 py-10 print:border-0 print:shadow-none print:rounded-none">
        {/* Cabecera */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-serif tracking-tight">Factura {f.numero}</h1>
            <div className="border-t-4 border-[#16211e] w-[420px] mt-1 mb-2" />
            <div className="text-[13px]">{fechaLarga(f.fecha)}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Lindilla" className="h-20 w-auto" />
        </div>

        {/* Emisor / cliente */}
        <div className="flex justify-between mt-8 text-[13px] leading-relaxed">
          <div>
            <div className="font-bold">{f.empresa.nombre}</div>
            {f.empresa.direccion && <div>{f.empresa.direccion}</div>}
            {f.empresa.cif && <div>NIF: {f.empresa.cif}</div>}
          </div>
          <div className="text-right">
            <div className="font-bold">Lindilla S.L.</div>
            <div>C/Poeta Mª Carlota Rodriguez 31</div>
            <div>29190 Málaga</div>
            <div className="font-bold">NIF B23872617</div>
          </div>
        </div>

        {/* Líneas */}
        <table className="w-full mt-8 text-[13px]">
          <thead>
            <tr className="border-y-2 border-[#16211e]">
              <th className="text-left py-2 font-semibold w-[110px]">CANTIDAD</th>
              <th className="text-left py-2 font-semibold">DETALLES</th>
              <th className="text-right py-2 font-semibold w-[100px]">P.Unidad</th>
              <th className="text-right py-2 font-semibold w-[110px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-[#faf7f2]" : ""}>
                <td className="py-2.5 px-1">{l.cantidad}</td>
                <td className="py-2.5 px-1">{l.concepto}</td>
                <td className="py-2.5 px-1 text-right">{l.precioUnitario.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                <td className="py-2.5 px-1 text-right">{(l.cantidad * l.precioUnitario).toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {/* filas vacías para respirar como en la plantilla original */}
            {lineas.length < 4 &&
              Array.from({ length: 4 - lineas.length }).map((_, i) => (
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
              <span className="text-[#5b6b66]">Total neto</span>
              <span>{euro(netoMostrar)}</span>
            </div>
            {f.iva !== 0 && (
              <div className="flex justify-between py-1">
                <span className="text-[#5b6b66]">Impuesto 21%</span>
                <span>{euro(f.iva)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t-2 border-[#16211e] mt-2 pt-2">
              <span className="font-bold text-[15px] text-[#c96f00]">€ TOTAL</span>
              <span className="font-bold text-[19px] text-[#c96f00]">{euro(totalMostrar)}</span>
            </div>
          </div>
        </div>

        {/* Banda de pago parcial (adelanto / resto), como en las facturas originales */}
        {parcial && (
          <div className="mt-6 flex items-center justify-between bg-[#4e8f84] text-white rounded px-5 py-2.5">
            <span className="font-semibold text-[14px]">{parcial.etiqueta}</span>
            <span className="font-bold text-[16px]">{euro(parcial.importe)}</span>
          </div>
        )}

        {/* Pie: pago e información */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-[#d9d2c7] text-[12px] leading-relaxed">
          <div>
            <div className="font-serif text-[13px] text-[#c96f00] mb-2">DETALLES DEL PAGO</div>
            <div>Nombre del beneficiario: Lindilla S.L.</div>
            <div>Nombre del banco: Banco Santander</div>
            <div>Número de cuenta: ES05 0049 4394 2227 1007 1254</div>
          </div>
          <div className="text-right">
            <div className="font-serif text-[13px] text-[#c96f00] mb-2">INFORMACIÓN ADICIONAL</div>
            <div>Mercedes Marcos Ferrando</div>
            <div>Teléfono: 609215196</div>
            <div>www.lindilla.com</div>
            <div>info@lindilla.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
