"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";

const schema = z.object({
  email: z.string().email("Неверный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

export function LoginForm({ className }: React.ComponentProps<"form">) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }

    const { error } = await signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
      fetchOptions: {
        onError: (ctx) => {
          if (ctx.response.status === 429) {
            setError("Забагато спроб. Спробуйте через 15 хвилин.");
          } else {
            setError("Невірний email або пароль");
          }
        },
      },
    });

    if (error) {
      setLoading(false);
      return;
    }

    router.push("/dashboard/stats");
    router.refresh();
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Вхід у ваш акаунт</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Введіть ваш email та пароль нижче, щоб увійти у акаунт
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Пароль</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Забули пароль?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Вхід..." : "Увійти"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
