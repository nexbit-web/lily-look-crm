import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      orders: { select: { id: true } },
    },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, notes } = await req.json();
    if (!name)
      return NextResponse.json({ error: "Ім'я обов'язкове" }, { status: 400 });
    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
      },
    });
    return NextResponse.json(customer);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email або телефон вже існує" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Помилка" }, { status: 500 });
  }
}
