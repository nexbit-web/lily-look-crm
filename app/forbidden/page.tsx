"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm text-center">
        <div className="mb-4 text-5xl">🚫</div>
        <h1 className="mb-2 text-2xl font-semibold">Немає доступу</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          У вас недостатньо прав для перегляду цієї сторінки. Зверніться до
          адміністратора.
        </p>

        <Link className="flex items-center justify-center gap-2 border-1 p-2 rounded-2xl" href="/dashboard">
          {" "}
          <ArrowLeft />
          Повернутися на головну
        </Link>
      </div>
    </div>
  );
}
