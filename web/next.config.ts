import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit necesita sus archivos de fuentes (.afm) en tiempo de ejecución;
  // si Next.js lo empaqueta con webpack/turbopack esos archivos se quedan
  // fuera y falla en producción (Vercel) aunque funcione en local.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
