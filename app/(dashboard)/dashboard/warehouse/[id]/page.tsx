"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowLeft, Pencil, Package, Tag, Hash, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

type Variant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

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

export default function ProductViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => setProduct(data))
      .catch(() => toast.error("Не вдалося завантажити продукт"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );

  if (!product)
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-gray-400">
        Продукт не знайдено
      </div>
    );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Навигация */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push("/dashboard/warehouse")}
            className="cursor-pointer  flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Товари</span>
          </button>
          <Button
            onClick={() => router.push(`/dashboard/warehouse/${id}/edit`)}
            className="cursor-pointer  px-5 h-9 text-sm font-medium bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all"
          >
            <Pencil />
            Редагувати
          </Button>
        </div>

        {/* Карточка продукта */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800 mb-4">

          {/* Изображение или заглушка */}
          {product.imageUrl ? (
            <div className="w-full h-64 overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
              <Package size={48} className="text-gray-300 dark:text-zinc-600" />
            </div>
          )}

          {/* Заголовок */}
          <div className="p-6 pb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {product.name}
              </h1>
              {product.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>
            <Badge
              className={`shrink-0 mt-1 ${
                product.isActive
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {product.isActive ? "Активний" : "Неактивний"}
            </Badge>
          </div>

          {/* Ключевые метрики */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-zinc-800 border-t border-gray-100 dark:border-zinc-800">
            <Metric label="Ціна" value={`${product.price} ₴`} />
            <Metric label="На складі" value={String(product.stock)} />
            <Metric label="Варіанти" value={String(product.variants.length)} />
          </div>
        </div>

        {/* Деталі */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm mb-4 overflow-hidden">
          <div className="px-6 pt-5 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
              Деталі
            </h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            <DetailRow icon={<Hash size={15} />} label="Артикул (SKU)" value={product.sku} />
            <DetailRow icon={<Tag size={15} />} label="Категорія" value={product.category?.name ?? "—"} />
            <DetailRow
              icon={<Calendar size={15} />}
              label="Створено"
              value={formatDate(product.createdAt)}
            />
            <DetailRow
              icon={<RefreshCw size={15} />}
              label="Оновлено"
              value={formatDate(product.updatedAt)}
            />
          </div>
        </div>

        {/* Варианты */}
        {product.variants.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                Варіанти · {product.variants.length}
              </h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {product.variants.map((v, i) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-zinc-400">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {v.size} · {v.color}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                </div>
              ))}
            </div>
          </div>
        )}
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
    <div className="flex items-center justify-between px-6 py-3.5">
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