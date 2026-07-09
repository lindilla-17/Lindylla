import { PrismaClient } from "@prisma/client";
import facturasReales from "./facturas-reales.json";
import presupuestosReales from "./presupuestos-reales.json";
import gastosReales from "./gastos-reales.json";

const prisma = new PrismaClient();

// Carga SOLO datos reales, extraídos de los PDFs de C:\Users\lindymarcos\Lindilla\cuentas.
// Las facturas de años pasados se marcan como PAGADAS por defecto (supuesto razonable
// para histórico); las de los últimos 60 días como PENDIENTES. Ajustable desde la web.

async function main() {
  console.log("Limpiando datos anteriores...");
  await prisma.lineaPresupuesto.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.presupuesto.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.empresa.deleteMany();
  await prisma.producto.deleteMany();

  console.log("Creando productos reales...");
  await prisma.producto.createMany({
    data: [
      { nombre: "Gorro quirófano pelo corto", categoria: "GORRO", descripcion: "Gorro de tela personalizado, modelo corto.", precioBase: 6.0, unidad: "ud", consumoTelaCm: 65 },
      { nombre: "Gorro quirófano pelo largo", categoria: "GORRO", descripcion: "Gorro de tela personalizado, modelo largo.", precioBase: 6.0, unidad: "ud", consumoTelaCm: 75 },
      { nombre: "Personalización en congreso", categoria: "OTRO", descripcion: "Bordado de nombres en vivo en el stand.", precioBase: 4.15, unidad: "ud" },
      { nombre: "Botones cosidos", categoria: "OTRO", descripcion: "Botón extra ya cosido al gorro.", precioBase: 0.7, unidad: "ud" },
      { nombre: "Calcetines corporativos", categoria: "OTRO", descripcion: "Calcetines personalizados con caña de 35 cm.", precioBase: 7.8, unidad: "ud" },
      { nombre: "Saquitos", categoria: "OTRO", descripcion: "Saquito de tela personalizado.", precioBase: 4.2, unidad: "ud" },
      { nombre: "Merchandising congreso", categoria: "OTRO", descripcion: "Paraguas, cuadernos, bolígrafos, polos... personalizados.", precioBase: 0, unidad: "lote" },
    ],
  });

  console.log("Creando empresas reales (CRM jerárquico)...");
  const bausch = await prisma.empresa.create({
    data: {
      nombre: "Bausch + Lomb",
      tipo: "MATRIZ",
      sector: "Oftalmología",
      notas: "Cuenta matriz. Cada delegación por país pide y factura de forma independiente.",
    },
  });
  const delegaciones = [
    { nombre: "Bausch + Lomb España", pais: "España", cif: "A60567922", carpeta: "Bausch España", direccion: "Avda. Valdelaparra, 4 Apdo · 28108 Alcobendas, Madrid" },
    { nombre: "Bausch + Lomb Francia", pais: "Francia", cif: "FR29340275650", carpeta: "Bausch Francia", direccion: "Laboratoire Chauvin · 416 Rue Samuel Morse, CS 79005 · 34967 Montpellier cedex 2, Francia", notas: "Laboratoire Chauvin / B&L France SAS, Montpellier" },
    { nombre: "Bausch + Lomb Italia", pais: "Italia", cif: "07393830158", carpeta: "Bausch Italia", direccion: "Bausch & Lomb IOM S.p.A. · Viale Martesana, 12 · 20055 Vimodrone (MI), Italia", notas: "Bausch & Lomb IOM S.p.A., Vimodrone (MI)" },
    { nombre: "Bausch + Lomb Portugal", pais: "Portugal", cif: "980218764", carpeta: "bausch Portugal", direccion: "Avda. De la Republica nº25, Fracção 6 A · 1050-186 Lisboa, Portugal", notas: "Lisboa" },
    { nombre: "Bausch + Lomb UK", pais: "Reino Unido", cif: "GB 609030374", carpeta: "Bausch UK", direccion: "106-114 London Road · Kingston upon Thames, KT2 6TN, Reino Unido", notas: "Kingston upon Thames" },
    { nombre: "Bausch + Lomb Polonia", pais: "Polonia", cif: "NIP 5252810445", carpeta: "Bausch Polonia", direccion: "Bausch & Lomb Sp. z o.o. · ul. Marynarska 15 · 02-674 Warszawa, Polonia", notas: "Bausch & Lomb Sp. z o.o., Varsovia" },
  ];
  for (const d of delegaciones) {
    await prisma.empresa.create({ data: { ...d, tipo: "DELEGACION", sector: "Oftalmología", parentId: bausch.id } });
  }

  const staar = await prisma.empresa.create({
    data: { nombre: "STAAR Surgical", tipo: "MATRIZ", sector: "Cirugía / Lentes intraoculares", carpeta: "staar" },
  });
  await prisma.empresa.create({
    data: { nombre: "STAAR Surgical España", tipo: "DELEGACION", pais: "España", cif: "W0393574I", sector: "Cirugía", parentId: staar.id, carpeta: "staar", direccion: "Avda. Meridiana 216, 1º Despacho 4 · 08027 Barcelona", notas: "STAAR Surgical AG, Sucursal en España (Barcelona)" },
  });

  await prisma.empresa.createMany({
    data: [
      { nombre: "Johnson & Johnson Vision", tipo: "MATRIZ", pais: "España", cif: "B83255372", sector: "Oftalmología", carpeta: "Johnson", direccion: "JJ Surgical Vision Spain, S.L. · Paseo de las doce estrellas 5-7 · 28042 Madrid", notas: "JJ Surgical Vision Spain, S.L. (Madrid)" },
      { nombre: "Biotech Healthcare Iberia", tipo: "MATRIZ", pais: "España", cif: "B67354746", sector: "Oftalmología", carpeta: "biotech", direccion: "Av. de les Corts Catalanes 9-11, Planta 2-9D · 08173 Sant Cugat del Vallès, Barcelona", notas: "Sant Cugat del Vallès, Barcelona" },
      { nombre: "DM Médica", tipo: "MATRIZ", pais: "España", cif: "B84831205", sector: "Distribución médica", carpeta: "DM medica", direccion: "C/ Aguacate 41, Edif. B, Portal 3, planta 2 · 28054 Madrid", notas: "Distribución y Comercialización Médica S.L. (Madrid)" },
      // Clientes con carpeta de trabajos pero sin factura registrada todavía
      { nombre: "Quirónsalud", tipo: "MATRIZ", pais: "España", sector: "Grupo hospitalario", carpeta: "quiron", notas: "Solo muestras por ahora, sin facturas." },
      { nombre: "Rayner", tipo: "MATRIZ", pais: "Reino Unido", sector: "Lentes intraoculares", carpeta: "Rayner Francia", notas: "Sin facturas registradas." },
      { nombre: "Hanita Lenses", tipo: "MATRIZ", pais: "Israel", sector: "Lentes intraoculares", carpeta: "Hanita", notas: "Sin facturas registradas." },
      { nombre: "Maite Alibau", tipo: "MATRIZ", pais: "España", sector: "Clínica", carpeta: "Maite Alibau", notas: "Presupuesto enviado, sin factura." },
      { nombre: "Naha Ibérica", tipo: "MATRIZ", pais: "España", sector: "Distribución médica", carpeta: "Naha iberica", notas: "Presupuesto de bolsas, sin factura registrada." },
    ],
  });

  console.log("Cargando facturas reales desde facturas-reales.json...");
  const empresas = await prisma.empresa.findMany();
  const porNombre = new Map(empresas.map((e) => [e.nombre, e]));

  let creadas = 0;
  for (const f of facturasReales.facturas) {
    const empresa = porNombre.get(f.cliente);
    if (!empresa) {
      console.warn(`⚠️ Cliente no encontrado: ${f.cliente} (factura ${f.numero})`);
      continue;
    }
    await prisma.factura.create({
      data: {
        numero: f.numero,
        empresaId: empresa.id,
        fecha: new Date(f.fecha),
        // Histórico: se asumen cobradas (confirmado por la dueña). Ajustable desde la web.
        estado: "PAGADA",
        neto: f.neto,
        iva: Math.round((f.total - f.neto) * 100) / 100,
        total: f.total,
        concepto: f.concepto,
        lineasJson: (() => {
          const ext = f as { lineas?: unknown; parcial?: unknown };
          if (!ext.lineas) return null;
          // Facturas de adelanto/resto: guardamos las líneas del pedido completo + la parte a pagar
          return ext.parcial
            ? JSON.stringify({ lineas: ext.lineas, parcial: ext.parcial })
            : JSON.stringify(ext.lineas);
        })(),
        archivo: f.archivo,
        notas: (f as { nota?: string }).nota ?? null,
      },
    });
    creadas++;
  }

  console.log("Cargando presupuestos reales desde presupuestos-reales.json...");
  let presCreados = 0;
  for (const p of presupuestosReales.presupuestos) {
    const empresa = porNombre.get(p.cliente);
    if (!empresa) {
      console.warn(`⚠️ Cliente no encontrado: ${p.cliente} (presupuesto ${p.numero})`);
      continue;
    }
    const pres = await prisma.presupuesto.create({
      data: {
        numero: p.numero,
        empresaId: empresa.id,
        tipo: p.tipo,
        fecha: new Date(p.fecha),
        estado: p.estado,
        notas: (p as { nota?: string }).nota ?? null,
        archivo: p.archivo,
        carpeta: p.carpetaPedido,
        lineas: {
          create: [{ concepto: p.concepto, cantidad: 1, precioUnitario: p.importe }],
        },
      },
    });
    const facturaNumero = (p as { facturaNumero?: string }).facturaNumero;
    if (facturaNumero) {
      const r = await prisma.factura.updateMany({
        where: { numero: facturaNumero },
        data: { presupuestoId: pres.id },
      });
      if (r.count === 0) console.warn(`⚠️ Factura no encontrada para enlazar: ${facturaNumero} (presupuesto ${p.numero})`);
    }
    presCreados++;
  }

  console.log("Cargando gastos reales desde gastos-reales.json...");
  let gastosCreados = 0;
  for (const g of gastosReales.gastos) {
    await prisma.gasto.create({
      data: {
        concepto: g.concepto,
        categoria: g.categoria,
        proveedor: g.proveedor,
        fecha: new Date(g.fecha),
        neto: g.neto,
        iva: g.iva,
        importe: g.importe,
        estado: "PAGADO", // son justificantes de pagos ya realizados
        archivo: g.archivo,
      },
    });
    gastosCreados++;
  }

  console.log(`✅ Datos reales cargados: ${creadas} facturas, ${presCreados} presupuestos, ${gastosCreados} gastos, ${empresas.length} empresas.`);
  console.log("ℹ️ Gastos registrados: 2026, 2025, 2024 y 2023 (gastos reales de material, confección, mercería, importaciones, canal Amazon...). Excluidos por decisión de Mercedes: comisiones Amazon 2023 (2024 sí se mantiene), compra del coche Flexicar (falta desglose de IVA), y varios gastos personales/no deducibles. Detalle en gastos-reales.json (_pendientes).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
