// Tipos de trabajo profesional y su etiqueta legible.
// En módulo aparte (no "use server") para poder exportar la constante
// y usarla tanto en servidor como en componentes cliente.
export const TRABAJOS = {
  CONSULTA: "Consulta",
  CATARATA: "Cirugía de cataratas",
  REFRACTIVA: "Cirugía refractiva",
} as const;

export type TipoTrabajo = keyof typeof TRABAJOS;

// Formas singular/plural para redactar los conceptos de factura
const PLURAL: Record<TipoTrabajo, [string, string]> = {
  CONSULTA: ["consulta", "consultas"],
  CATARATA: ["cirugía de cataratas", "cirugías de cataratas"],
  REFRACTIVA: ["cirugía refractiva", "cirugías refractivas"],
};

// Ej.: (CATARATA, 2) -> "2 cirugías de cataratas"
export function etiquetaCantidad(tipo: TipoTrabajo, n: number): string {
  return `${n} ${PLURAL[tipo][n === 1 ? 0 : 1]}`;
}
