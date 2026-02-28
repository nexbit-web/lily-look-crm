"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { ArrowLeft, CheckCircle2, CalendarIcon, Receipt } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

// ─── Types & Constants ────────────────────────────────────────────────────────

type ExpenseCategory =
  | "ADVERTISING"
  | "PHOTOGRAPHER"
  | "DELIVERY"
  | "SALARY"
  | "DISCOUNT_LOSS"
  | "PURCHASE"
  | "BANK_FEE"
  | "OTHER";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ADVERTISING: "Реклама",
  PHOTOGRAPHER: "Фотограф",
  DELIVERY: "Доставка",
  SALARY: "Зарплата",
  DISCOUNT_LOSS: "Товар зі знижкою",
  PURCHASE: "Закупка товарів",
  BANK_FEE: "Відсоток банку",
  OTHER: "Інше",
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  ADVERTISING: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  PHOTOGRAPHER:
    "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  DELIVERY: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  SALARY: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  DISCOUNT_LOSS: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  PURCHASE:
    "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  BANK_FEE:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  OTHER: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300",
};

// ─── Components ───────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionHeader({
  step,
  done,
  title,
  icon,
}: {
  step: number;
  done: boolean;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-50 dark:border-zinc-800">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
          done
            ? "bg-green-500 text-white"
            : "bg-gray-100 dark:bg-zinc-800 text-gray-400",
        )}
      >
        {done ? <CheckCircle2 size={14} /> : step}
      </div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-zinc-200">
        {icon}
        {title}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddExpensePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());

  const step1Done = !!(category && amount && parseFloat(amount) > 0);
  const step2Done = !!expenseDate;
  const formValid = step1Done && step2Done;

  const handleSave = useCallback(async () => {
    if (!formValid) {
      toast.error("Заповніть усі обов'язкові поля");
      return;
    }
    const parsed = parseFloat(amount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Некоректна сума");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount: parsed,
          description: description.trim() || null,
          date: expenseDate.toISOString(),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error);
      }
      toast.success("Витрату додано!");
      router.push("/dashboard/expenses");
    } catch (e: any) {
      toast.error(e.message || "Помилка");
    } finally {
      setSaving(false);
    }
  }, [category, amount, description, expenseDate, formValid, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Шапка */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Нова витрата
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Заповніть дані про витрату
            </p>
          </div>
        </div>

        {/* Крок 1 — Категорія та сума */}
        <div
          className={cn(
            "bg-white dark:bg-zinc-900 rounded-3xl border transition-colors",
            step1Done
              ? "border-green-100 dark:border-green-900"
              : "border-gray-100 dark:border-zinc-800",
          )}
        >
          <SectionHeader
            step={1}
            done={step1Done}
            title="Категорія та сума"
            icon={<Receipt size={15} />}
          />
          <div className="p-5 flex flex-col gap-4">
            <Field label="Категорія *">
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ExpenseCategory)}
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Оберіть категорію витрати..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(
                      Object.entries(CATEGORY_LABELS) as [
                        ExpenseCategory,
                        string,
                      ][]
                    ).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        <div className="flex items-center gap-2">
                          <Badge className={CATEGORY_COLORS[val]}>
                            {label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Сума (₴) *">
              <Input
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl h-11 text-lg font-semibold"
                type="number"
                min="0"
                step="0.01"
              />
            </Field>

            <Field label="Опис">
              <Input
                placeholder="Необов'язковий коментар (напр. Facebook квітень)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl h-11"
              />
            </Field>
          </div>
        </div>

        {/* Крок 2 — Дата */}
        <div
          className={cn(
            "bg-white dark:bg-zinc-900 rounded-3xl border transition-colors",
            !step1Done
              ? "opacity-50 pointer-events-none border-gray-100 dark:border-zinc-800"
              : step2Done
                ? "border-green-100 dark:border-green-900"
                : "border-gray-100 dark:border-zinc-800",
          )}
        >
          <SectionHeader
            step={2}
            done={step2Done}
            title="Дата витрати"
            icon={<CalendarIcon size={15} />}
          />
          <div className="p-5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal rounded-xl h-11 gap-2 text-base"
                >
                  <CalendarIcon size={16} className="text-gray-400" />
                  {expenseDate
                    ? format(expenseDate, "dd MMMM yyyy", { locale: uk })
                    : "Оберіть дату"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                <Calendar
                  mode="single"
                  selected={expenseDate}
                  onSelect={(d) => d && setExpenseDate(d)}
                  locale={uk}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-400 mt-2">
              Можна вказати задню дату — наприклад якщо витрата була вчора
            </p>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-11 cursor-pointer"
            onClick={() => router.back()}
            disabled={saving}
          >
            Скасувати
          </Button>
          <Button
            className="flex-1 rounded-2xl h-11 cursor-pointer font-medium"
            onClick={handleSave}
            disabled={saving || !formValid}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Збереження...
              </span>
            ) : (
              "Зберегти витрату"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
