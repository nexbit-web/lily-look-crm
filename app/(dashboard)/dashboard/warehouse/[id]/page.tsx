"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Pencil,
  Package,
  Tag,
  Hash,
  Calendar,
  RefreshCw,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { RoleGate } from "@/components/Role-gate";

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = { id: string; size: string; color: string; stock: number };
type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string;
  category: Category;
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductViewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch(() => toast.error("Не вдалося завантажити продукт"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Усі обчислення — один useMemo, не рендериться заново
  const stats = useMemo(() => {
    if (!product) return null;
    const hasVariants = product.variants.length > 0;
    const realStock = hasVariants
      ? product.variants.reduce((s, v) => s + v.stock, 0)
      : product.stock;
    const availableVariants = product.variants.filter(
      (v) => v.stock > 0,
    ).length;
    return { hasVariants, realStock, availableVariants };
  }, [product]);

  // ── Loading / Empty ──
  if (loading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );

  if (!product || !stats)
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-gray-400">
        Продукт не знайдено
      </div>
    );

  const { hasVariants, realStock, availableVariants } = stats;

  const stockAccent =
    realStock === 0 ? "red" : realStock <= 5 ? "yellow" : "green";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* ── Шапка ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/warehouse")}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight line-clamp-1">
                {product.name}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
            </div>
          </div>
          <RoleGate allowed={["MANAGER", "ADMIN"]}>
            <Button
              onClick={() => router.push(`/dashboard/warehouse/${id}/edit`)}
              variant="outline"
              className="rounded-full px-4 h-9 text-sm cursor-pointer gap-1.5"
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">Редагувати</span>
            </Button>
          </RoleGate>
        </div>

        {/* ── Зображення + назва ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-56 object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
              <Package size={44} className="text-gray-300 dark:text-zinc-600" />
            </div>
          )}

          <div className="px-5 pt-4 pb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight truncate">
                {product.name}
              </h2>
              {product.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>
            <Badge
              className={`shrink-0 mt-0.5 ${
                product.isActive
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {product.isActive ? "Активний" : "Неактивний"}
            </Badge>
          </div>
        </div>

        {/* ── Метрики ── */}
        <div
          className={`bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 grid divide-x divide-gray-100 dark:divide-zinc-800 ${
            hasVariants ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          <Metric label="Ціна" value={`${product.price} ₴`} />
          <Metric
            label="На складі"
            value={`${realStock} шт`}
            accent={stockAccent}
          />
          {hasVariants && (
            <Metric
              label="Варіантів"
              value={`${availableVariants} / ${product.variants.length}`}
              hint="в наявності"
            />
          )}
        </div>

        {/* ── Деталі ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <SectionHeader title="Деталі" />
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            <DetailRow
              icon={<Hash size={14} />}
              label="Артикул (SKU)"
              value={product.sku}
            />
            <DetailRow
              icon={<Tag size={14} />}
              label="Категорія"
              value={product.category?.name ?? "—"}
            />
            <DetailRow
              icon={<Calendar size={14} />}
              label="Створено"
              value={fmt(product.createdAt)}
            />
            <DetailRow
              icon={<RefreshCw size={14} />}
              label="Оновлено"
              value={fmt(product.updatedAt)}
            />
          </div>
        </div>

        {/* ── Варіанти ── */}
        {hasVariants && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <SectionHeader
              title={`Варіанти · ${product.variants.length}`}
              icon={<Layers size={14} />}
              right={
                <span className="text-xs text-gray-400">
                  Всього:{" "}
                  <span
                    className={`font-semibold ${
                      realStock === 0
                        ? "text-red-500"
                        : realStock <= 5
                          ? "text-yellow-600"
                          : "text-gray-700 dark:text-zinc-200"
                    }`}
                  >
                    {realStock} шт
                  </span>
                </span>
              }
            />
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {product.variants.map((v, i) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-gray-400 shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium">
                      {v.size}
                      <span className="text-gray-400 mx-1.5">·</span>
                      {v.color}
                    </p>
                  </div>
                  <Badge
                    className={
                      v.stock > 5
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : v.stock > 0
                          ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                          : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    }
                  >
                    {v.stock} шт
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
  right,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 dark:border-zinc-800">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
        {icon}
        {title}
      </div>
      {right}
    </div>
  );
}

function Metric({
  label,
  value,
  accent = "default",
  hint,
}: {
  label: string;
  value: string;
  accent?: "default" | "green" | "yellow" | "red";
  hint?: string;
}) {
  const color =
    accent === "red"
      ? "text-red-500 dark:text-red-400"
      : accent === "yellow"
        ? "text-yellow-600 dark:text-yellow-400"
        : accent === "green"
          ? "text-green-600 dark:text-green-400"
          : "text-gray-900 dark:text-white";

  return (
    <div className="flex flex-col items-center justify-center py-5 gap-0.5">
      <span className={`text-lg font-semibold tabular-nums ${color}`}>
        {value}
      </span>
      <span className="text-xs text-gray-400 dark:text-zinc-500">{label}</span>
      {hint && (
        <span className="text-xs text-gray-300 dark:text-zinc-600">{hint}</span>
      )}
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
