import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

// Genera el PDF de una factura de Lindilla (gorros) en el servidor, con el
// mismo contenido que la vista de impresión: logo, cliente/emisor, líneas
// (cantidad, concepto, precio, total), totales, banda de adelanto/resto si
// aplica, y el pie con datos de pago e información adicional.

export type LineaPdf = { concepto: string; cantidad: number; precioUnitario: number };
export type ParcialPdf = { etiqueta: string; importe: number } | null;

export type FacturaLindillaPdfDatos = {
  numero: string;
  fecha: Date;
  clienteNombre: string;
  clienteDireccion?: string | null;
  clienteCif?: string | null;
  lineas: LineaPdf[];
  neto: number; // si hay parcial, es la suma de las líneas (pedido completo)
  iva: number;
  total: number; // si hay parcial, es lineas + iva (no el importe parcial)
  parcial?: ParcialPdf;
};

const euro = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fechaLarga = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

export function generarFacturaLindillaPdf(f: FacturaLindillaPdfDatos): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Logo
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.jpg");
      if (fs.existsSync(logoPath)) doc.image(logoPath, 460, 40, { height: 70 });
    } catch {
      // sin logo, no pasa nada
    }

    // Cabecera
    doc.fillColor("#16211e").fontSize(24).text(`Factura ${f.numero}`, 50, 55);
    doc.moveTo(50, 92).lineTo(430, 92).lineWidth(3).strokeColor("#16211e").stroke();
    doc.fontSize(11).text(fechaLarga(f.fecha), 50, 100);

    // Cliente / Emisor
    const bloqueTop = 150;
    doc.fontSize(11).fillColor("#16211e").text(f.clienteNombre, 50, bloqueTop, { width: 260 });
    if (f.clienteDireccion) doc.fontSize(9).text(f.clienteDireccion, 50, bloqueTop + 15, { width: 260 });
    if (f.clienteCif) doc.fontSize(9).text(`NIF: ${f.clienteCif}`, 50, bloqueTop + 28);

    doc.fontSize(11).text("Lindilla S.L.", 300, bloqueTop, { width: 245, align: "right" });
    doc.fontSize(9).text("C/Poeta Mª Carlota Rodriguez 31", 300, bloqueTop + 15, { width: 245, align: "right" });
    doc.text("29190 Málaga", 300, bloqueTop + 27, { width: 245, align: "right" });
    doc.fontSize(10).text("NIF B23872617", 300, bloqueTop + 40, { width: 245, align: "right" });

    // Tabla de líneas
    const tablaTop = bloqueTop + 90;
    doc.moveTo(50, tablaTop).lineTo(545, tablaTop).lineWidth(1.5).stroke();
    doc.fontSize(9).fillColor("#16211e");
    doc.text("CANTIDAD", 55, tablaTop + 8, { width: 60 });
    doc.text("DETALLES", 120, tablaTop + 8, { width: 280 });
    doc.text("P.UNIDAD", 400, tablaTop + 8, { width: 65, align: "right" });
    doc.text("TOTAL", 470, tablaTop + 8, { width: 75, align: "right" });
    doc.moveTo(50, tablaTop + 22).lineTo(545, tablaTop + 22).lineWidth(1.5).stroke();

    let y = tablaTop + 32;
    for (const l of f.lineas) {
      doc.fontSize(10).text(String(l.cantidad), 55, y, { width: 60 });
      doc.text(l.concepto, 120, y, { width: 280 });
      doc.text(euro(l.precioUnitario), 400, y, { width: 65, align: "right" });
      doc.text(euro(l.cantidad * l.precioUnitario), 470, y, { width: 75, align: "right" });
      y += 20;
    }

    // Totales
    const totTop = Math.max(y + 20, tablaTop + 140);
    doc.fontSize(10).fillColor("#5b6b66").text("Total neto", 350, totTop, { width: 100 });
    doc.fillColor("#16211e").text(euro(f.neto), 460, totTop, { width: 80, align: "right" });

    let totTop2 = totTop + 16;
    if (f.iva !== 0) {
      doc.fillColor("#5b6b66").text("Impuesto 21%", 350, totTop2, { width: 100 });
      doc.fillColor("#16211e").text(euro(f.iva), 460, totTop2, { width: 80, align: "right" });
      totTop2 += 20;
    }

    doc.moveTo(350, totTop2).lineTo(545, totTop2).lineWidth(1.5).strokeColor("#16211e").stroke();
    doc.fontSize(13).fillColor("#c96f00").text("€ TOTAL", 350, totTop2 + 8, { width: 100 });
    doc.fontSize(15).text(euro(f.total), 440, totTop2 + 6, { width: 105, align: "right" });

    let bandaBottom = totTop2 + 30;

    // Banda de pago parcial (adelanto / resto)
    if (f.parcial) {
      const bandaTop = totTop2 + 30;
      doc.rect(50, bandaTop, 495, 32).fill("#4e8f84");
      doc.fillColor("#ffffff").fontSize(12).text(f.parcial.etiqueta, 60, bandaTop + 9);
      doc.fontSize(13).text(euro(f.parcial.importe), 400, bandaTop + 8, { width: 135, align: "right" });
      bandaBottom = bandaTop + 32;
    }

    // Pie: pago e información
    const pieTop = bandaBottom + 40;
    doc.moveTo(50, pieTop).lineTo(545, pieTop).lineWidth(0.5).strokeColor("#d9d2c7").stroke();

    doc.fontSize(11).fillColor("#c96f00").text("DETALLES DEL PAGO", 50, pieTop + 12);
    doc.fontSize(9).fillColor("#16211e");
    doc.text("Nombre del beneficiario: Lindilla S.L.", 50, pieTop + 30);
    doc.text("Nombre del banco: Banco Santander", 50, pieTop + 44);
    doc.text("Número de cuenta: ES05 0049 4394 2227 1007 1254", 50, pieTop + 58);

    doc.fontSize(11).fillColor("#c96f00").text("INFORMACIÓN ADICIONAL", 300, pieTop + 12, { width: 245, align: "right" });
    doc.fontSize(9).fillColor("#16211e");
    doc.text("Mercedes Marcos Ferrando", 300, pieTop + 30, { width: 245, align: "right" });
    doc.text("Teléfono: 609215196", 300, pieTop + 44, { width: 245, align: "right" });
    doc.text("www.lindilla.com", 300, pieTop + 58, { width: 245, align: "right" });
    doc.text("info@lindilla.com", 300, pieTop + 72, { width: 245, align: "right" });

    doc.end();
  });
}
