import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(discounts);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const discount = await prisma.discount.create({ data: body });
  return NextResponse.json(discount);
}