import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: "Помилка завантаження" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
    }

    const { category, amount, description, date } = await req.json();

    if (!category || !amount || !date) {
      return NextResponse.json({ error: "Заповніть обов'язкові поля" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        amount,
        description: description?.trim() || null,
        date: new Date(date),
        createdById: session.user.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: "Помилка створення" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
    }

    const { id } = await req.json();
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Помилка видалення" }, { status: 500 });
  }
}