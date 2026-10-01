import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

// Genera el PDF del documento de desglose informativo de una factura de
// Centroveo (de dónde sale el importe: cuántas unidades de cada actividad y
// su precio). No es la factura fiscal, es un documento aparte para el cliente.

export type LineaPdf = { concepto: string; cantidad: number; precioUnitario: number };

export type DesglosePdfDatos = {
  numero: string;
  fecha: Date;
  cliente: string;
  lineas: LineaPdf[];
  total: number;
};

const euro = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fechaLarga = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

export function generarDesglosePdf(f: DesglosePdfDatos): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      const logoPath = path.join(process.cwd(), "public", "centroveo.png");
      if (fs.existsSync(logoPath)) doc.image(logoPath, 400, 45, { width: 140 });
    } catch {
      // sin logo, no pasa nada
    }

    doc.fillColor("#16211e").fontSize(20).text("Desglose del importe facturado", 50, 55, { width: 340 });
    doc.fontSize(10).fillColor("#5b6b66").text(`Factura ${f.numero} · ${fechaLarga(f.fecha)} · ${f.cliente}`, 50, 85, { width: 340 });

    // Aviso de que no es la factura fiscal
    const avisoTop = 110;
    doc.roundedRect(50, avisoTop, 495, 34, 4).fillAndStroke("#fdf3e2", "#e9c98a");
    doc
      .fillColor("#8a5a12")
      .fontSize(9)
      .text(
        `Documento informativo interno — no sustituye a la factura fiscal ${f.numero}, que lleva concepto único ("Servicios profesionales").`,
        60,
        avisoTop + 10,
        { width: 475 }
      );

    // Tabla
    const tablaTop = avisoTop + 55;
    doc.moveTo(50, tablaTop).lineTo(545, tablaTop).lineWidth(1.5).strokeColor("#16211e").stroke();
    doc.fontSize(9).fillColor("#16211e");
    doc.text("CONCEPTO", 55, tablaTop + 8, { width: 280 });
    doc.text("UDS.", 340, tablaTop + 8, { width: 50, align: "right" });
    doc.text("P. UNIDAD", 400, tablaTop + 8, { width: 65, align: "right" });
    doc.text("IMPORTE", 470, tablaTop + 8, { width: 75, align: "right" });
    doc.moveTo(50, tablaTop + 22).lineTo(545, tablaTop + 22).lineWidth(1.5).stroke();

    let y = tablaTop + 32;
    if (f.lineas.length === 0) {
      doc.fontSize(10).fillColor("#5b6b66").text("No hay desglose guardado para esta factura.", 55, y, { width: 480, align: "center" });
      y += 20;
    } else {
      for (const l of f.lineas) {
        doc.fontSize(10).fillColor("#16211e");
        doc.text(l.concepto, 55, y, { width: 280 });
        doc.text(String(l.cantidad), 340, y, { width: 50, align: "right" });
        doc.text(euro(l.precioUnitario), 400, y, { width: 65, align: "right" });
        doc.text(euro(l.cantidad * l.precioUnitario), 470, y, { width: 75, align: "right" });
        y += 20;
      }
    }

    // Total
    const totTop = y + 20;
    doc.moveTo(350, totTop).lineTo(545, totTop).lineWidth(1.5).strokeColor("#16211e").stroke();
    doc.fontSize(13).fillColor("#c96f00").text("TOTAL FACTURADO", 350, totTop + 8, { width: 110 });
    doc.fontSize(15).text(euro(f.total), 440, totTop + 6, { width: 105, align: "right" });

    doc.end();
  });
}
