import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
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

    // Перевірка дубліката SKU
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Продукт з артикулом "${data.sku}" вже існує` },
        { status: 400 },
      );
    }

    // Якщо є варіанти — stock = сума всіх варіантів
    // Якщо варіантів немає — stock береться з форми
    const hasVariants = data.variants?.length > 0;
    const totalStock = hasVariants
      ? data.variants.reduce(
          (sum: number, v: any) => sum + (parseInt(v.stock) || 0),
          0,
        )
      : data.stock;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        costPrice: data.costPrice ?? 0,  
        sku: data.sku,
        stock: totalStock,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive ?? true,
        categoryId: data.categoryId,
        variants: hasVariants
          ? {
              create: data.variants.map(
                (v: { size: string; color: string; stock: string }) => ({
                  size: v.size,
                  color: v.color,
                  stock: parseInt(v.stock) || 0,
                }),
              ),
            }
          : undefined,
      },
      include: { variants: true, category: true },
    });

    return NextResponse.json(product);
  } catch (error: any) {
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
