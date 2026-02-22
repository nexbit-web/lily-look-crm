import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        manager: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
    });
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Помилка" }, { status: 500 });
  }
}
