import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrintBar } from "@/components/PrintBar";

export const dynamic = "force-dynamic";

const euro = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fechaLarga = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

export default async function ImprimirPresupuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.presupuesto.findUnique({ where: { id }, include: { empresa: true, lineas: true } });
  if (!p) notFound();

  const neto = p.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const iva = p.conIva ? neto * 0.21 : 0;
  const total = neto + iva;
  const importeAdelanto = p.adelantoPct ? (total * p.adelantoPct) / 100 : 0;

  return (
    <div className="max-w-[820px] mx-auto px-8 py-6">
      <PrintBar volverHref="/presupuestos" volverLabel="← Volver a presupuestos" />

      {/* --- Hoja de presupuesto --- */}
      <div className="factura-hoja bg-white text-[#16211e] rounded-xl border border-[var(--border)] shadow-sm px-12 py-10 print:border-0 print:shadow-none print:rounded-none">
        {/* Cabecera: sin número, es un documento informativo */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-serif tracking-tight">Presupuesto</h1>
            <div className="border-t-4 border-[#16211e] w-[420px] mt-1 mb-2" />
            <div className="text-[13px]">{fechaLarga(p.fecha)}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Lindilla" className="h-20 w-auto" />
        </div>

        {/* Emisor / cliente */}
        <div className="flex justify-between mt-8 text-[13px] leading-relaxed">
          <div>
            <div className="font-bold">{p.empresa.nombre}</div>
            {p.empresa.direccion && <div>{p.empresa.direccion}</div>}
            {p.empresa.cif && <div>NIF: {p.empresa.cif}</div>}
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
            {p.lineas.map((l, i) => (
              <tr key={l.id} className={i % 2 === 0 ? "bg-[#faf7f2]" : ""}>
                <td className="py-2.5 px-1">{l.cantidad}</td>
                <td className="py-2.5 px-1">{l.concepto}</td>
                <td className="py-2.5 px-1 text-right">{l.precioUnitario.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                <td className="py-2.5 px-1 text-right">{(l.cantidad * l.precioUnitario).toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {p.lineas.length < 4 &&
              Array.from({ length: 4 - p.lineas.length }).map((_, i) => (
                <tr key={`v${i}`} className={(p.lineas.length + i) % 2 === 0 ? "bg-[#faf7f2]" : ""}>
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
              <span>{euro(neto)}</span>
            </div>
            {p.conIva && (
              <div className="flex justify-between py-1">
                <span className="text-[#5b6b66]">Impuesto 21%</span>
                <span>{euro(iva)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t-2 border-[#16211e] mt-2 pt-2">
              <span className="font-bold text-[15px] text-[#c96f00]">€ TOTAL</span>
              <span className="font-bold text-[19px] text-[#c96f00]">{euro(total)}</span>
            </div>
          </div>
        </div>

        {/* Banda de adelanto solicitado, como en las facturas de adelanto/resto */}
        {p.adelantoPct && (
          <div className="mt-6 flex items-center justify-between bg-[#4e8f84] text-white rounded px-5 py-2.5">
            <span className="font-semibold text-[14px]">Adelanto solicitado ({p.adelantoPct}%)</span>
            <span className="font-bold text-[16px]">{euro(importeAdelanto)}</span>
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

        <div className="mt-6 text-[11px] text-center text-[#9a9186]">
          Presupuesto sin validez fiscal. Precios válidos salvo error tipográfico.
        </div>
      </div>
    </div>
  );
}
