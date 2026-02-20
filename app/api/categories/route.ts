import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Помилка" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug } = await req.json();
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Назва та slug обов'язкові" },
        { status: 400 },
      );
    }
    const category = await prisma.category.create({ data: { name, slug } });
    return NextResponse.json(category);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Slug вже існує" }, { status: 400 });
    }
    return NextResponse.json({ error: "Помилка" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Помилка видалення" }, { status: 500 });
  }
}
