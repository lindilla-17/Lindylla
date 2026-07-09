import fs from "node:fs";
import path from "node:path";

// Comprueba dónde está el PDF de cada factura:
//  - en su carpeta de cuentas del año (C:\...\Lindilla\cuentas\<año>\...)
//  - en la carpeta de la empresa (C:\...\Lindilla\trabajos empresas\<carpeta>\...)

const RUTA_CUENTAS = "C:\\Users\\lindymarcos\\Lindilla\\cuentas";
const RUTA_EMPRESAS = "C:\\Users\\lindymarcos\\Lindilla\\trabajos empresas";

// Cache por proceso: lista de archivos por directorio raíz (se refresca cada 5 min)
const cache = new Map<string, { files: Set<string>; at: number }>();
const TTL = 5 * 60 * 1000;

function listarArchivos(raiz: string): Set<string> {
  const hit = cache.get(raiz);
  if (hit && Date.now() - hit.at < TTL) return hit.files;

  const files = new Set<string>();
  try {
    const entries = fs.readdirSync(raiz, { recursive: true, encoding: "utf8" });
    for (const e of entries) {
      files.add(path.basename(e).toLowerCase());
    }
  } catch {
    // La carpeta no existe o no hay permisos: devolvemos vacío sin romper la página.
  }
  cache.set(raiz, { files, at: Date.now() });
  return files;
}

export function estaEnCuentas(archivo: string | null, year: number): boolean {
  if (!archivo) return false;
  const files = listarArchivos(path.join(RUTA_CUENTAS, String(year)));
  return files.has(archivo.toLowerCase());
}

export function estaEnCarpetaEmpresa(archivo: string | null, carpetaEmpresa: string | null): boolean {
  if (!archivo || !carpetaEmpresa) return false;
  const files = listarArchivos(path.join(RUTA_EMPRESAS, carpetaEmpresa));
  return files.has(archivo.toLowerCase());
}
