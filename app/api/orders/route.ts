import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      manager: { select: { id: true, name: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  try {
    // Получаем сессию через better-auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

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

    const total = items.reduce(
      (sum: number, i: any) => sum + i.price * i.quantity,
      0,
    );

    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) throw new Error(`Продукт не знайдено`);
        if (product.stock < item.quantity) {
          throw new Error(`Недостатньо товару "${product.name}" на складі`);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.create({
        data: {
          customerId,
          managerId: session.user.id, // ← из сессии better-auth
          total,
          items: {
            create: items.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price,
            })),
          },
        },
        include: {
          customer: true,
          manager: { select: { id: true, name: true } },
          items: { include: { product: true } },
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
