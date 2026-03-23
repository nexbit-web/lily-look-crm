import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      manager: { select: { id: true, name: true } },
      items: {
        include: {
          product: true,
          variant: true, // ← тепер повертаємо варіант
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

type OrderItemInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
    }

    const { customerId, items } = await req.json();
    if (!customerId || !items?.length) {
      return NextResponse.json(
        { error: "Клієнт та товари обов'язкові" },
        { status: 400 },
      );
    }

    const total = (items as OrderItemInput[]).reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

    const order = await prisma.$transaction(async (tx) => {
      // Массив для хранения costPrice по каждому item
      const costPrices: number[] = [];

      for (const item of items as OrderItemInput[]) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (!variant) throw new Error(`Варіант не знайдено`);
          if (variant.stock < item.quantity)
            throw new Error(`Недостатньо варіанту на складі`);

          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) throw new Error(`Продукт не знайдено`);

          costPrices.push(product.costPrice); // ← snapshot

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) throw new Error(`Продукт не знайдено`);
          if (product.stock < item.quantity)
            throw new Error(`Недостатньо товару "${product.name}" на складі`);

          costPrices.push(product.costPrice); // ← snapshot

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return tx.order.create({
        data: {
          customerId,
          managerId: session.user.id,
          total,
          items: {
            create: (items as OrderItemInput[]).map((i, index) => ({
              productId: i.productId,
              variantId: i.variantId ?? null,
              quantity: i.quantity,
              price: i.price,
              costPrice: costPrices[index] ?? 0, // ← snapshot
            })),
          },
        },
        include: {
          customer: true,
          manager: { select: { id: true, name: true } },
          items: { include: { product: true, variant: true } },
        },
      });
    });

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Помилка" },
      { status: 500 },
    );
  }
}
