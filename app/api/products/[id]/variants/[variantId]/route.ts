import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> },
) {
  try {
    const { variantId } = await params;
    await prisma.productVariant.delete({ where: { id: variantId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Помилка видалення варіанту" },
      { status: 500 },
    );
  }
}
