import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Tarea programada (Vercel Cron, cada 3 días) para que Supabase nunca llegue
// a los 7 días sin actividad que hacen que su plan gratuito pause la base de
// datos. Solo hace una consulta mínima, no cambia nada.
export async function GET() {
  const empresas = await prisma.empresa.count();
  return NextResponse.json({ ok: true, empresas, fecha: new Date().toISOString() });
}
