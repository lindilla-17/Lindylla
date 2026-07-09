import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { RUTA_FOTOS_GORROS } from "@/lib/gorros";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// Sirve una imagen de la carpeta de fotos de gorros.
// Solo permite rutas dentro de esa carpeta (nunca fuera) y solo imágenes.
export async function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("p");
  if (!rel) return new NextResponse("Falta el parámetro p", { status: 400 });

  const abs = path.resolve(RUTA_FOTOS_GORROS, rel);
  if (!abs.startsWith(path.resolve(RUTA_FOTOS_GORROS) + path.sep)) {
    return new NextResponse("Ruta no permitida", { status: 403 });
  }
  const mime = MIME[path.extname(abs).toLowerCase()];
  if (!mime) return new NextResponse("Tipo de archivo no permitido", { status: 403 });

  try {
    const data = fs.readFileSync(abs);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("No encontrada", { status: 404 });
  }
}
