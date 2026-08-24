import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit necesita sus archivos de fuentes (.afm) en tiempo de ejecución;
  // si Next.js lo empaqueta con webpack/turbopack esos archivos se quedan
  // fuera y falla en producción (Vercel) aunque funcione en local.
  serverExternalPackages: ["pdfkit"],
  experimental: {
    // Por defecto las Server Actions solo aceptan 1MB; una foto de móvil
    // (justificante de gasto) pesa varios MB, así que se queda colgada sin
    // avisar de error si no se sube este límite.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
