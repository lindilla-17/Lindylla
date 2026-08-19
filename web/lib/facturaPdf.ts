import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

// Genera el PDF de una factura de Centroveo en el servidor (para poder
// subirlo solo a Google Drive, sin depender de que la usuaria pulse
// "Imprimir" en el navegador). Mismo contenido que la vista de impresión:
// logo, cliente/emisor, una línea con el concepto, totales y datos bancarios.

export type FacturaPdfDatos = {
  numero: string;
  fecha: Date;
  cliente: string;
  cifCliente?: string;
  concepto: string;
  neto: number;
  iva: number;
  total: number;
};

const euro = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fechaLarga = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

export function generarFacturaCentroveoPdf(f: FacturaPdfDatos): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Logo (si existe)
    try {
      const logoPath = path.join(process.cwd(), "public", "centroveo.png");
      if (fs.existsSync(logoPath)) doc.image(logoPath, 400, 45, { width: 140 });
    } catch {
      // sin logo, no pasa nada
    }

    // Cabecera
    doc.fillColor("#16211e").fontSize(24).text(`Factura ${f.numero}`, 50, 55);
    doc.moveTo(50, 92).lineTo(340, 92).lineWidth(3).strokeColor("#16211e").stroke();
    doc.fontSize(11).text(fechaLarga(f.fecha), 50, 100);

    // Cliente / Emisor
    const bloqueTop = 150;
    doc.fontSize(9).fillColor("#5b6b66").text("CLIENTE", 50, bloqueTop);
    doc.fillColor("#16211e").fontSize(11).text(f.cliente, 50, bloqueTop + 14, { width: 260 });
    if (f.cifCliente) doc.fontSize(9).fillColor("#16211e").text(`CIF: ${f.cifCliente}`, 50, bloqueTop + 30);

    doc.fontSize(11).text("Lindilla S.L. (Centroveo)", 300, bloqueTop, { width: 245, align: "right" });
    doc.fontSize(9).text("C/ Poeta Mª Carlota Rodríguez 31", 300, bloqueTop + 15, { width: 245, align: "right" });
    doc.text("29190 Málaga", 300, bloqueTop + 27, { width: 245, align: "right" });
    doc.fontSize(10).text("NIF B23872617", 300, bloqueTop + 40, { width: 245, align: "right" });

    // Línea del concepto
    const tablaTop = bloqueTop + 90;
    doc.moveTo(50, tablaTop).lineTo(545, tablaTop).lineWidth(1.5).stroke();
    doc.fontSize(9).fillColor("#16211e").text("CONCEPTO", 55, tablaTop + 8);
    doc.text("IMPORTE", 460, tablaTop + 8, { width: 80, align: "right" });
    doc.moveTo(50, tablaTop + 24).lineTo(545, tablaTop + 24).lineWidth(1.5).stroke();

    doc.fontSize(10).text(f.concepto, 55, tablaTop + 34, { width: 400 });
    doc.text(euro(f.neto), 460, tablaTop + 34, { width: 80, align: "right" });

    // Totales
    const totTop = tablaTop + 110;
    doc.fontSize(10).fillColor("#5b6b66").text("Base", 350, totTop, { width: 100 });
    doc.fillColor("#16211e").text(euro(f.neto), 460, totTop, { width: 80, align: "right" });

    doc.fillColor("#5b6b66").text(f.iva !== 0 ? "IVA" : "IVA (exenta)", 350, totTop + 16, { width: 100 });
    doc.fillColor("#16211e").text(euro(f.iva), 460, totTop + 16, { width: 80, align: "right" });

    doc.moveTo(350, totTop + 36).lineTo(545, totTop + 36).lineWidth(1.5).strokeColor("#16211e").stroke();
    doc.fontSize(13).fillColor("#c96f00").text("TOTAL", 350, totTop + 44, { width: 100 });
    doc.fontSize(15).text(euro(f.total), 440, totTop + 42, { width: 105, align: "right" });

    // Pie: datos bancarios (mismos que las facturas de Lindilla)
    const pieTop = totTop + 110;
    doc.moveTo(50, pieTop).lineTo(545, pieTop).lineWidth(0.5).strokeColor("#d9d2c7").stroke();
    doc.fontSize(11).fillColor("#c96f00").text("DETALLES DEL PAGO", 50, pieTop + 12);
    doc.fontSize(9).fillColor("#16211e");
    doc.text("Nombre del beneficiario: Lindilla S.L.", 50, pieTop + 30);
    doc.text("Nombre del banco: Banco Santander", 50, pieTop + 44);
    doc.text("Número de cuenta: ES05 0049 4394 2227 1007 1254", 50, pieTop + 58);

    doc.end();
  });
}
