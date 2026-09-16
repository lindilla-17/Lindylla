import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  await prisma.presupuesto.delete({ where: { id: "cmu4cxpby0001l304nargpbr1" } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
