"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Form = { name: string; phone: string; email: string; address: string };

const EMPTY: Form = { name: "", phone: "", email: "", address: "" };

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  step,
  title,
  icon,
  done,
  children,
}: {
  step: number;
  title: string;
  icon: React.ReactNode;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-3xl border transition-colors ${
        done
          ? "border-green-100 dark:border-green-900"
          : "border-gray-100 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-50 dark:border-zinc-800">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
            done
              ? "bg-green-500 text-white"
              : "bg-gray-100 dark:bg-zinc-800 text-gray-400"
          }`}
        >
          {done ? <CheckCircle2 size={14} /> : step}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-zinc-200">
          {icon}
          {title}
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddCustomerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const returnTo = searchParams.get("returnTo");

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const step1Done = !!form.name.trim();
  const step2Done = !!(form.phone.trim() || form.email.trim());

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Ім'я обов'язкове");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          notes: form.address.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const created = await res.json();
      toast.success("Клієнта створено!");

      if (returnTo) {
        router.push(`${returnTo}?customerId=${created.id}`);
      } else {
        router.push("/dashboard/customers");
      }
    } catch (error: any) {
      toast.error(error.message || "Помилка");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4  flex flex-col gap-6">
        {/* ── Шапка ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(returnTo ?? "/dashboard/customers")}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Новий клієнт
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {returnTo
                ? "Після збереження повернетесь до замовлення"
                : "Додайте нового клієнта до бази"}
            </p>
          </div>
        </div>

        {/* ── Крок 1: Ім'я ── */}
        <Section
          step={1}
          title="Ім'я клієнта"
          icon={<User size={16} />}
          done={step1Done}
        >
          <Field label="Повне ім'я" required>
            <Input
              name="name"
              placeholder="Наприклад: Олена Коваль"
              value={form.name}
              onChange={handleChange}
              className="rounded-xl"
              autoFocus
            />
          </Field>
        </Section>

        {/* ── Крок 2: Контакти ── */}
        <Section
          step={2}
          title="Контакти"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.09-1.16a2 2 0 012.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0122 14.92z" />
            </svg>
          }
          done={step2Done}
        >
          <p className="text-xs text-gray-400 -mt-1">
            Вкажіть хоча б один спосіб зв'язку
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Телефон">
              <Input
                name="phone"
                placeholder="+380 XX XXX XX XX"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                className="rounded-xl"
              />
            </Field>
            <Field label="Email">
              <Input
                name="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                type="email"
                className="rounded-xl"
              />
            </Field>
          </div>
        </Section>

        {/* ── Крок 3: Адреса доставки ── */}
        <Section
          step={3}
          title="Адреса доставки"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
          done={!!form.address.trim()}
        >
          <p className="text-xs text-gray-400 -mt-1">
            Необов'язково — можна заповнити пізніше
          </p>
          <Field label="Повна адреса">
            <Input
              name="address"
              placeholder="м. Київ, Відділення №1"
              value={form.address}
              onChange={handleChange}
              className="rounded-xl"
            />
          </Field>
        </Section>

        {/* ── Кнопки ── */}
        <div className="flex gap-2.5 pb-4">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-11 cursor-pointer"
            onClick={() => router.push(returnTo ?? "/dashboard/customers")}
            disabled={submitting}
          >
            Скасувати
          </Button>
          <Button
            className="flex-1 rounded-2xl h-11 font-medium cursor-pointer"
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim()}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Збереження...
              </span>
            ) : (
              "Створити клієнта"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
