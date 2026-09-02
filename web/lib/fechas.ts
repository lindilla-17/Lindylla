// Trimestre de una fecha: 1, 2, 3 o 4. Mismo criterio que se usa para las
// carpetas de Google Drive (cuentas/<año>/<N>º trimestre/...).
export function trimestreDeFecha(fecha: Date): number {
  return Math.floor(fecha.getMonth() / 3) + 1;
}

export const NOMBRES_TRIMESTRE = ["1º trimestre", "2º trimestre", "3º trimestre", "4º trimestre"];
