import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true, category: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не вдалося отримати продукти" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("POST /api/products ->", data);

    // Проверка дубликата SKU
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Продукт з артикулом "${data.sku}" вже існує` },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        sku: data.sku,
        stock: data.stock,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive ?? true,
        categoryId: data.categoryId,
        variants: data.variants?.length
          ? {
              create: data.variants.map((v: any) => ({
                size: v.size,
                color: v.color,
                stock: v.stock,
              })),
            }
          : undefined,
      },
      include: { variants: true, category: true },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    // Подстраховка на случай race condition
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Продукт з таким артикулом вже існує" },
        { status: 400 },
      );
    }
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: error.message || "Не вдалося додати продукт" },
      { status: 500 },
    );
  }
}
