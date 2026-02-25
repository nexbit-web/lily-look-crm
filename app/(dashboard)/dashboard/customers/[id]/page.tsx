"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Pencil, ShoppingBag, Phone, Mail, Calendar, House } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = { id: string; status: string; total: number; createdAt: string };
type Customer = {
  id: string; name: string; phone: string | null;
  email: string | null; notes: string | null;
  createdAt: string; updatedAt: string; orders: Order[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новий", CONFIRMED: "Підтверджено", SHIPPED: "Відправлено",
  COMPLETED: "Виконано", CANCELED: "Скасовано", RETURNED: "Повернено",
};

const STATUS_COLORS: Record<string, string> = {
  NEW:       "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  CONFIRMED: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  SHIPPED:   "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  CANCELED:  "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  RETURNED:  "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerViewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/customers/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { if (!cancelled) setCustomer(data); })
      .catch(() => toast.error("Не вдалося завантажити клієнта"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const stats = useMemo(() => {
    if (!customer) return null;
    const completed  = customer.orders.filter((o) => o.status === "COMPLETED");
    const totalSpent = completed.reduce((s, o) => s + o.total, 0);
    return { completed: completed.length, totalSpent };
  }, [customer]);

  if (loading)
    return <div className="flex min-h-[80vh] items-center justify-center"><Spinner className="h-6 w-6" /></div>;

  if (!customer || !stats)
    return <div className="flex min-h-[80vh] items-center justify-center text-gray-400">Клієнта не знайдено</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

        {/* ── Шапка ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/customers")}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{customer.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Картка клієнта</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/customers/${id}/edit`)}
            className="rounded-full px-4 h-9 text-sm cursor-pointer gap-1.5"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">Редагувати</span>
          </Button>
        </div>

        {/* ── Метрики ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800">
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-zinc-800">
            <Metric label="Замовлень" value={String(customer.orders.length)} />
            <Metric label="Виконано"  value={String(stats.completed)} accent="green" />
            <Metric label="Витрачено" value={`${stats.totalSpent.toFixed(0)} ₴`} />
          </div>
        </div>

        {/* ── Контакти ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <SectionHeader title="Контакти" />
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            <DetailRow icon={<Phone size={14} />}    label="Телефон"         value={customer.phone ?? "—"} />
            <DetailRow icon={<Mail size={14} />}     label="Email"           value={customer.email ?? "—"} />
            {customer.notes && (
              <DetailRow icon={<House size={14} />}  label="Адреса доставки" value={customer.notes} />
            )}
            <DetailRow icon={<Calendar size={14} />} label="Дата реєстрації" value={fmtDate(customer.createdAt)} />
          </div>
        </div>

        {/* ── Замовлення ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <SectionHeader title={`Замовлення · ${customer.orders.length}`} />
          {customer.orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-300 dark:text-zinc-600">
              <ShoppingBag size={32} strokeWidth={1.5} />
              <p className="text-sm">Замовлень ще немає</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {customer.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold tabular-nums">{order.total.toFixed(0)} ₴</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[order.status] ?? ""}>
                    {STATUS_LABELS[order.status] ?? order.status}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 pt-4 pb-3 border-b border-gray-50 dark:border-zinc-800">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
        {title}
      </p>
    </div>
  );
}

function Metric({ label, value, accent = "default" }: {
  label: string; value: string; accent?: "default" | "green";
}) {
  return (
    <div className="flex flex-col items-center justify-center py-5 gap-0.5">
      <span className={`text-xl font-semibold tabular-nums ${
        accent === "green" ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
      }`}>
        {value}
      </span>
      <span className="text-xs text-gray-400 dark:text-zinc-500">{label}</span>
    </div>
  );
}

function DetailRow({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-2.5 text-gray-400 dark:text-zinc-500 shrink-0">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%] break-words">
        {value}
      </span>
    </div>
  );
}