"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          notes: data.notes ?? "",
        });
      })
      .catch(() => toast.error("Не вдалося завантажити клієнта"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Ім'я обов'язкове");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  if (loading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/customers/${id}`)}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Редагувати клієнта
          </h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 flex flex-col gap-4">
          <Label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
            Дані клієнта
          </Label>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Ім'я *</Label>
            <Input
              name="name"
              placeholder="Ім'я клієнта"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Телефон</Label>
            <Input
              name="phone"
              placeholder="+380..."
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Email</Label>
            <Input
              name="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Нотатки</Label>
            <Input
              name="notes"
              placeholder="Додаткова інформація..."
              value={form.notes}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/dashboard/customers/${id}`)}
            disabled={submitting}
          >
            Скасувати
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim()}
          >
            {submitting ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </div>
    </div>
  );
}
