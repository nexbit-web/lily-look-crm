"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Phone, House, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Form = { name: string; phone: string; email: string; notes: string };

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ step, title, icon, done, children }: {
  step: number; title: string; icon: React.ReactNode;
  done: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-3xl border transition-colors ${
      done ? "border-green-100 dark:border-green-900" : "border-gray-100 dark:border-zinc-800"
    }`}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-50 dark:border-zinc-800">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
          done ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-400"
        }`}>
          {done ? <CheckCircle2 size={14} /> : step}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-zinc-200">
          {icon}
          {title}
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm]             = useState<Form>({ name: "", phone: "", email: "", notes: "" });
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/customers/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        if (cancelled) return;
        setForm({
          name:  data.name  ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          notes: data.notes ?? "",
        });
      })
      .catch(() => toast.error("Не вдалося завантажити клієнта"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Ім'я обов'язкове"); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:  form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Клієнта оновлено!");
      router.push(`/dashboard/customers/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Помилка");
    } finally {
      setSubmitting(false);
    }
  };

  const step1Done = !!form.name.trim();
  const step2Done = !!(form.phone.trim() || form.email.trim());
  const step3Done = !!form.notes.trim();

  if (loading)
    return <div className="flex min-h-[80vh] items-center justify-center"><Spinner className="h-6 w-6" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Шапка ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/customers/${id}`)}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Редагувати клієнта</h1>
            <p className="text-xs text-gray-400 mt-0.5">Змініть потрібні поля та збережіть</p>
          </div>
        </div>

        {/* ── Крок 1: Ім'я ── */}
        <Section step={1} title="Ім'я клієнта" icon={<User size={16} />} done={step1Done}>
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
        <Section step={2} title="Контакти" icon={<Phone size={16} />} done={step2Done}>
          <p className="text-xs text-gray-400 -mt-1">Вкажіть хоча б один спосіб зв'язку</p>
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
        <Section step={3} title="Адреса доставки" icon={<House size={16} />} done={step3Done}>
          <p className="text-xs text-gray-400 -mt-1">Необов'язково — для швидкого оформлення замовлень</p>
          <Field label="Повна адреса">
            <Input
              name="notes"
              placeholder="м. Київ, вул. Хрещатик, 1, кв. 10"
              value={form.notes}
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
            onClick={() => router.push(`/dashboard/customers/${id}`)}
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
            ) : "Зберегти"}
          </Button>
        </div>

      </div>
    </div>
  );
}