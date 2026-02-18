import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm text-center">
        <div className="mb-4 text-5xl">🚫</div>
        <h1 className="mb-2 text-2xl font-semibold">Нет доступа</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          У вас недостаточно прав для просмотра этой страницы. Обратитесь к
          администратору.
        </p>
        <Button asChild className="w-full">
          <Link href="/dashboard">Вернуться на главную</Link>
        </Button>
      </div>
    </div>
  );
}
