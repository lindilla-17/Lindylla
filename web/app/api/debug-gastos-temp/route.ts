import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  await prisma.presupuesto.delete({ where: { id: "cmu2y3ok30001jn0481wpluas" } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
