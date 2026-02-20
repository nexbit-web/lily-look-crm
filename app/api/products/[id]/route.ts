import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, category: true },
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: "Не вдалося отримати продукт" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await req.json();

    await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        price: parseFloat(data.price),
        sku: data.sku,
        stock: parseInt(data.stock),
        categoryId: data.categoryId,
      },
    });

    if (data.variants?.length) {
      for (const v of data.variants) {
        if (v.id) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: { size: v.size, color: v.color, stock: parseInt(v.stock) },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              size: v.size,
              color: v.color,
              stock: parseInt(v.stock),
              productId: id,
            },
          });
        }
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, category: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Не вдалося оновити продукт" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log("DELETE /api/products/[id] ->", id);

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error.message || "Помилка видалення" },
      { status: 500 },
    );
  }
}
