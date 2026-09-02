// Reduce una foto del móvil (a veces 10-20MB en un iPhone reciente) a un
// tamaño manejable antes de subirla. 1800px de lado más largo es de sobra
// para leer un recibo o factura. Solo se usa en el navegador (componentes
// cliente), no en el servidor.
export async function comprimirImagen(file: File, maxLado = 1800, calidad = 0.75): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, ancho, alto);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", calidad));
  if (!blob || blob.size >= file.size) return file;

  const nombre = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], nombre, { type: "image/jpeg" });
}
