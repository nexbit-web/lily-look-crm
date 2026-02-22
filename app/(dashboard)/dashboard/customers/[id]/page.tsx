"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  ShoppingBag,
  Phone,
  Mail,
  FileText,
  Calendar,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  orders: Order[];
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новий",
  CONFIRMED: "Підтверджено",
  SHIPPED: "Відправлено",
  COMPLETED: "Виконано",
  CANCELED: "Скасовано",
  RETURNED: "Повернено",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  CONFIRMED:
    "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  SHIPPED: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  CANCELED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  RETURNED:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
};

export default function CustomerViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then(setCustomer)
      .catch(() => toast.error("Не вдалося завантажити клієнта"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );

  if (!customer)
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-gray-400">
        Клієнта не знайдено
      </div>
    );

  const totalSpent = customer.orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/customers")}
              className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold tracking-tight">
              {customer.name}
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/customers/${id}/edit`)}
            className="rounded-full px-5 h-9 text-sm"
          >
            <Pencil size={14} className="mr-2" />
            Редагувати
          </Button>
        </div>

        {/* Метрики */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-zinc-800">
            <Metric label="Замовлень" value={String(customer.orders.length)} />
            <Metric
              label="Виконано"
              value={String(
                customer.orders.filter((o) => o.status === "COMPLETED").length,
              )}
            />
            <Metric label="Витрачено" value={`${totalSpent.toFixed(0)} ₴`} />
          </div>
        </div>

        {/* Контакти */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
              Контакти
            </p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            <DetailRow
              icon={<Phone size={15} />}
              label="Телефон"
              value={customer.phone ?? "—"}
            />
            <DetailRow
              icon={<Mail size={15} />}
              label="Email"
              value={customer.email ?? "—"}
            />
            {customer.notes && (
              <DetailRow
                icon={<FileText size={15} />}
                label="Нотатки"
                value={customer.notes}
              />
            )}
            <DetailRow
              icon={<Calendar size={15} />}
              label="Дата реєстрації"
              value={new Date(customer.createdAt).toLocaleDateString("uk-UA", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
          </div>
        </div>

        {/* Замовлення */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
              Замовлення · {customer.orders.length}
            </p>
          </div>
          {customer.orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
              <ShoppingBag size={32} className="opacity-30" />
              <p className="text-sm">Замовлень ще немає</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium">{order.total} ₴</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-5 gap-1">
      <span className="text-xl font-semibold text-gray-900 dark:text-white">
        {value}
      </span>
      <span className="text-xs text-gray-400 dark:text-zinc-500">{label}</span>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-2.5 text-gray-400 dark:text-zinc-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}
