"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type NuevaEmpresaInput = {
  nombre: string;
  cif?: string;
  pais?: string;
  direccion?: string;
};

export type EmpresaCreada = {
  id: string;
  nombre: string;
  cif: string | null;
  direccion: string | null;
  pais: string | null;
};

// Alta rápida de una empresa nueva desde el propio formulario de presupuesto
// o factura (sin tener que ir antes a ningún otro sitio). La carpeta se pone
// igual al nombre por defecto: así la empresa aparece también en el
// desplegable de presupuestos, que solo lista empresas con carpeta asignada.
// Mercedes puede corregir luego el nombre de la carpeta real si no coincide.
export async function crearEmpresa(datos: NuevaEmpresaInput): Promise<{ ok: true; empresa: EmpresaCreada } | { ok: false; error: string }> {
  const nombre = datos.nombre.trim();
  if (!nombre) return { ok: false, error: "Escribe el nombre de la empresa." };

  const existente = await prisma.empresa.findFirst({ where: { nombre: { equals: nombre } } });
  if (existente) return { ok: false, error: `Ya existe una empresa llamada "${nombre}".` };

  const empresa = await prisma.empresa.create({
    data: {
      nombre,
      cif: datos.cif?.trim() || null,
      pais: datos.pais?.trim() || null,
      direccion: datos.direccion?.trim() || null,
      carpeta: nombre,
    },
  });

  revalidatePath("/empresas");
  revalidatePath("/facturas/nueva");
  revalidatePath("/presupuestos/nueva");

  return {
    ok: true,
    empresa: { id: empresa.id, nombre: empresa.nombre, cif: empresa.cif, direccion: empresa.direccion, pais: empresa.pais },
  };
}
