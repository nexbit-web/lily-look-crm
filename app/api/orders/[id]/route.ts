import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Товар повертається на склад ТІЛЬКИ при скасуванні
const RESTORE_STOCK_STATUSES = new Set(["CANCELED"]);
// Статуси при яких товар вважається списаним зі складу
const ACTIVE_STATUSES = new Set([
  "NEW",
  "CONFIRMED",
  "SHIPPED",
  "RETURNED",
  "COMPLETED",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    // Отримуємо поточне замовлення з усіма items та варіантами
    const existing = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { variant: true, product: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Замовлення не знайдено" },
        { status: 404 },
      );
    }

    const wasActive = ACTIVE_STATUSES.has(existing.status);
    const becomesRestored = RESTORE_STOCK_STATUSES.has(status);
    const wasRestored = RESTORE_STOCK_STATUSES.has(existing.status);
    const becomesActive = ACTIVE_STATUSES.has(status);

    const order = await prisma.$transaction(async (tx) => {
      // ── ВІДМІНА / ПОВЕРНЕННЯ: повертаємо товари на склад ──
      if (wasActive && becomesRestored) {
        for (const item of existing.items) {
          if (item.variantId && item.variant) {
            // Повертаємо варіант
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            // Повертаємо суммарний stock продукту
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            // Без варіанту — тільки продукт
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      // ── ВІДНОВЛЕННЯ: якщо повертаємо з відміни назад в активний — знімаємо знову ──
      if (wasRestored && becomesActive) {
        for (const item of existing.items) {
          if (item.variantId && item.variant) {
            if (item.variant.stock < item.quantity) {
              throw new Error(
                `Недостатньо варіанту "${item.variant.size}/${item.variant.color}" на складі`,
              );
            }
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          } else {
            if (item.product.stock < item.quantity) {
              throw new Error(
                `Недостатньо товару "${item.product.name}" на складі`,
              );
            }
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      // Оновлюємо статус
      return tx.order.update({
        where: { id },
        data: { status },
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
      { error: error.message || "Помилка оновлення статусу" },
      { status: 500 },
    );
  }
}
