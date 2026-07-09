import { PrismaClient } from "@prisma/client";

// Reutiliza una única conexión a la base de datos durante el desarrollo
// (evita abrir muchas conexiones al recargar en caliente).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
