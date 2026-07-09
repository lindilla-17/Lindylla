import fs from "node:fs";
import path from "node:path";

// Galería de gorros: lee las imágenes de la carpeta real del ordenador,
// agrupadas por subcarpeta (cada subcarpeta = un diseño/cliente).
export const RUTA_FOTOS_GORROS = "C:\\Users\\lindymarcos\\Lindilla\\fotos gorros\\empresa";

const EXTENSIONES_IMAGEN = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export type GrupoFotos = {
  nombre: string; // nombre de la subcarpeta (diseño/cliente)
  fotos: { nombre: string; archivo: string; rel: string }[]; // nombre = carpeta del gorro; rel = ruta para /api/foto
};

export function listarGorros(): GrupoFotos[] {
  let dirs: fs.Dirent[];
  try {
    dirs = fs.readdirSync(RUTA_FOTOS_GORROS, { withFileTypes: true });
  } catch {
    return [];
  }

  const grupos: GrupoFotos[] = [];

  // Imágenes sueltas en la raíz de "empresa"
  const sueltas = dirs
    .filter((d) => d.isFile() && EXTENSIONES_IMAGEN.has(path.extname(d.name).toLowerCase()))
    .map((d) => ({ nombre: "General", archivo: path.basename(d.name, path.extname(d.name)), rel: d.name }));
  if (sueltas.length > 0) grupos.push({ nombre: "General", fotos: sueltas });

  for (const d of dirs.filter((d) => d.isDirectory())) {
    let files: string[] = [];
    try {
      files = fs.readdirSync(path.join(RUTA_FOTOS_GORROS, d.name), { recursive: true, encoding: "utf8" });
    } catch {
      continue;
    }
    const fotos = files
      .filter((f) => EXTENSIONES_IMAGEN.has(path.extname(f).toLowerCase()))
      .map((f) => {
        // El nombre del gorro es la carpeta inmediata que contiene la foto
        const dirRel = path.dirname(f);
        const nombreGorro = dirRel === "." ? d.name : path.basename(dirRel);
        return {
          nombre: nombreGorro,
          archivo: path.basename(f, path.extname(f)),
          rel: path.join(d.name, f),
        };
      });
    if (fotos.length > 0) grupos.push({ nombre: d.name, fotos });
  }

  // Ordenar por número de fotos (los diseños con más material primero)
  return grupos.sort((a, b) => b.fotos.length - a.fotos.length);
}
