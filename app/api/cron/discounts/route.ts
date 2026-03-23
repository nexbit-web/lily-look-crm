import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { count } = await prisma.discount.updateMany({
    where:  { endsAt: { lt: new Date() }, isActive: true },
    data:   { isActive: false },
  });
  return NextResponse.json({ deactivated: count });
}