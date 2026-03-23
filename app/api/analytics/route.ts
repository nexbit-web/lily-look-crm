import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
} from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();

    // Визначаємо period з query params (за замовчуванням — поточний місяць)
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const from = fromParam
      ? startOfDay(new Date(fromParam))
      : startOfMonth(now);
    const to = toParam ? endOfDay(new Date(toParam)) : endOfMonth(now);

    // Попередній період (такий самий проміжок, але раніше)
    const periodLen = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodLen);
    const prevTo = new Date(to.getTime() - periodLen);

    // ── Замовлення поточного і попереднього COMPLETE ──────────────────────────
    const [currentOrders, prevOrders, allOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: {
          items: { include: { product: true, variant: true } },
          customer: true,
          manager: { select: { id: true, name: true } },
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: prevFrom, lte: prevTo } },
        select: { status: true, total: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          status: { in: ["COMPLETED", "NEW", "CONFIRMED", "SHIPPED"] },
        },
        select: { createdAt: true, total: true, status: true },
      }),
    ]);

    // ── Витрати ───────────────────────────────────────────────────────────────
    const [currentExpenses, prevExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: { date: { gte: from, lte: to } },
        select: { amount: true, category: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: prevFrom, lte: prevTo } },
        select: { amount: true },
      }),
    ]);

    // ── Клієнти ───────────────────────────────────────────────────────────────
    const [newCustomers, prevNewCustomers] = await Promise.all([
      prisma.customer.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.customer.count({
        where: { createdAt: { gte: prevFrom, lte: prevTo } },
      }),
    ]);

    // ── Менеджери ─────────────────────────────────────────────────────────────
    const managers = await prisma.order.groupBy({
      by: ["managerId"],
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ["COMPLETED", "NEW", "CONFIRMED", "SHIPPED"] },
        managerId: { not: null },
      },
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const managerIds = managers
      .map((m) => m.managerId)
      .filter(Boolean) as string[];
    const managerUsers = await prisma.user.findMany({
      where: { id: { in: managerIds } },
      select: { id: true, name: true, role: true },
    });

    const managersData = managers.map((m) => ({
      id: m.managerId,
      name: managerUsers.find((u) => u.id === m.managerId)?.name ?? "—",
      role: managerUsers.find((u) => u.id === m.managerId)?.role ?? "—",
      orders: m._count.id,
      revenue: Number(m._sum.total ?? 0),
    }));

    // ── Топ товари ────────────────────────────────────────────────────────────
    const productSales: Record<
      string,
      { name: string; qty: number; revenue: number }
    > = {};
    currentOrders
      .filter((o) =>
        ["COMPLETED", "NEW", "CONFIRMED", "SHIPPED"].includes(o.status),
      )
      .forEach((order) => {
        order.items.forEach((item) => {
          const key = item.productId;
          if (!productSales[key]) {
            productSales[key] = { name: item.product.name, qty: 0, revenue: 0 };
          }
          productSales[key].qty += item.quantity;
          productSales[key].revenue += item.price * item.quantity;
        });
      });

    const topProducts = Object.entries(productSales)
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // ── Розрахунки ────────────────────────────────────────────────────────────
    const completedOrders = currentOrders.filter(
      (o) => o.status === "COMPLETED",
    );
    const canceledOrders = currentOrders.filter((o) => o.status === "CANCELED");
    const returnedOrders = currentOrders.filter((o) => o.status === "RETURNED");
    const activeOrders = currentOrders.filter((o) =>
      ["NEW", "CONFIRMED", "SHIPPED"].includes(o.status),
    );

    const revenue = completedOrders.reduce((s, o) => s + o.total, 0);
    const prevRevenue = prevOrders
      .filter((o) => o.status === "COMPLETED")
      .reduce((s, o) => s + o.total, 0);
    const totalExpenses = currentExpenses.reduce(
      (s, e) => s + Number(e.amount),
      0,
    );
    const prevTotalExp = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = revenue - totalExpenses;
    const prevNetProfit = prevRevenue - prevTotalExp;

    

    // Відсоткові зміни
    const pct = (curr: number, prev: number) =>
      prev === 0 ? null : Number((((curr - prev) / prev) * 100).toFixed(1));

    const revenueGrowth = pct(revenue, prevRevenue);
    const expenseGrowth = pct(totalExpenses, prevTotalExp);
    const profitGrowth = pct(netProfit, prevNetProfit);
    const customerGrowth = pct(newCustomers, prevNewCustomers);

    // Витрати по категоріях
    const expenseByCategory: Record<string, number> = {};
    currentExpenses.forEach((e) => {
      expenseByCategory[e.category] =
        (expenseByCategory[e.category] ?? 0) + Number(e.amount);
    });

    // Продажі по днях (для графіку)
    const salesByDay: Record<string, { revenue: number; orders: number }> = {};
    allOrders.forEach((o) => {
      const day = o.createdAt.toISOString().split("T")[0];
      if (!salesByDay[day]) salesByDay[day] = { revenue: 0, orders: 0 };
      if (o.status === "COMPLETED") salesByDay[day].revenue += o.total;
      salesByDay[day].orders += 1;
    });

    const salesChart = Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, ...d }));

    return NextResponse.json({
      period: { from: from.toISOString(), to: to.toISOString() },
      // Головні метрики
      revenue,
      prevRevenue,
      revenueGrowth,
      totalExpenses,
      prevTotalExp,
      expenseGrowth,
      netProfit,
      prevNetProfit,
      profitGrowth,
      newCustomers,
      prevNewCustomers,
      customerGrowth,
      // Замовлення
      totalOrders: currentOrders.length,
      completedCount: completedOrders.length,
      canceledCount: canceledOrders.length,
      returnedCount: returnedOrders.length,
      activeCount: activeOrders.length,
      cancelRate:
        currentOrders.length > 0
          ? Number(
              ((canceledOrders.length / currentOrders.length) * 100).toFixed(1),
            )
          : 0,
      // Деталі
      expenseByCategory,
      topProducts,
      managersData,
      salesChart,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Помилка аналітики" }, { status: 500 });
  }
}
