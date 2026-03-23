"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Trash,
  Package,
  Tag,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { RoleGate } from "@/components/Role-gate";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string; slug: string };

type VariantForm = { id?: string; size: string; color: string; stock: string };

type ProductForm = {
  name: string;
  article: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
  categoryId: string;
  variants: VariantForm[];
  costPrice: string;
};

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

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [product, setProduct] = useState<ProductForm>({
    name: "",
    article: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    isActive: true,
    categoryId: "",
    variants: [],
    costPrice: "",
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([p, cats]) => {
        if (cancelled) return;
        setCategories(cats);
        setProduct({
          name: p.name ?? "",
          article: p.sku ?? "",
          description: p.description ?? "",
          price: String(p.price ?? ""),
          stock: String(p.stock ?? ""),
          imageUrl: p.imageUrl ?? "",
          isActive: p.isActive ?? true,
          categoryId: p.categoryId ?? "",
          costPrice: String(p.costPrice ?? ""),
          variants: (p.variants ?? []).map(
            (v: {
              id: string;
              size: string;
              color: string;
              stock: number;
            }) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              stock: String(v.stock),
            }),
          ),
        });
      })
      .catch(() => toast.error("Не вдалося завантажити продукт"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct((p) => ({ ...p, [name]: value }));
  }, []);

  const addVariant = useCallback(() => {
    setProduct((p) => ({
      ...p,
      variants: [...p.variants, { size: "", color: "", stock: "" }],
    }));
  }, []);

  const updateVariant = useCallback(
    (index: number, key: keyof VariantForm, value: string) => {
      setProduct((p) => {
        const variants = [...p.variants];
        variants[index] = { ...variants[index], [key]: value };
        return { ...p, variants };
      });
    },
    [],
  );

  const removeVariant = useCallback((index: number) => {
    setProduct((p) => {
      const variant = p.variants[index];
      if (variant.id) setDeletedVariantIds((prev) => [...prev, variant.id!]);
      return { ...p, variants: p.variants.filter((_, i) => i !== index) };
    });
  }, []);

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Видаляємо позначені варіанти
      if (deletedVariantIds.length > 0) {
        await Promise.all(
          deletedVariantIds.map((vid) =>
            fetch(`/api/products/${id}/variants/${vid}`, { method: "DELETE" }),
          ),
        );
      }

      // Якщо є варіанти — stock = сума варіантів
      const hasVariants = product.variants.length > 0;
      const totalStock = hasVariants
        ? product.variants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0)
        : parseInt(product.stock) || 0;

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name.trim(),
          description: product.description.trim() || null,
          price: parseFloat(product.price),
          sku: product.article.trim(),
          stock: totalStock,
          imageUrl: product.imageUrl.trim() || null,
          isActive: product.isActive,
          categoryId: product.categoryId,
          costPrice: parseFloat(product.costPrice) || 0,
          variants: product.variants.map((v) => ({
            id: v.id,
            size: v.size.trim(),
            color: v.color.trim(),
            stock: parseInt(v.stock) || 0,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Помилка");
      }

      toast.success("Продукт збережено!");
      router.push(`/dashboard/warehouse/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Не вдалося зберегти продукт");
    } finally {
      setSaving(false);
    }
  };

  // Прогрес секцій
  const step1Done = !!(product.name.trim() && product.article.trim());
  const step2Done = !!(product.price && product.stock && product.categoryId);
  const step3Done =
    product.variants.length > 0 &&
    product.variants.every((v) => v.size.trim() && v.color.trim() && v.stock);

  if (loading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* ── Шапка ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/warehouse/${id}`)}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Редагувати продукт
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Змініть потрібні поля та збережіть
            </p>
          </div>
        </div>

        {/* ── Крок 1: Назва та артикул ── */}
        <Section
          step={1}
          title="Назва та артикул"
          icon={<Tag size={16} />}
          done={step1Done}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Назва" required>
              <Input
                name="name"
                placeholder="Назва товару"
                value={product.name}
                onChange={handleChange}
                className="rounded-xl"
              />
            </Field>
            <Field label="Артикул (SKU)" required>
              <Input
                name="article"
                placeholder="000000"
                value={product.article}
                onChange={handleChange}
                className="rounded-xl font-mono"
              />
            </Field>
            <Field label="Опис">
              <Input
                name="description"
                placeholder="Короткий опис товару"
                value={product.description}
                onChange={handleChange}
                className="rounded-xl"
              />
            </Field>
            <Field label="URL зображення">
              <Input
                name="imageUrl"
                placeholder="https://..."
                value={product.imageUrl}
                onChange={handleChange}
                className="rounded-xl"
              />
            </Field>
          </div>
        </Section>

        {/* ── Крок 2: Ціна та категорія ── */}
        <Section
          step={2}
          title="Ціна та категорія"
          icon={<Package size={16} />}
          done={step2Done}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ціна (₴)" required>
              <Input
                name="price"
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                value={product.price}
                onChange={handleChange}
                className="rounded-xl"
              />
            </Field>

            <RoleGate allowed={["OWNER", "ADMIN", "MANAGER"]}>
              <Field label="Закупочна ціна (₴)">
                <Input
                  name="costPrice"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.costPrice}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </Field>
            </RoleGate>
            <Field label="Кількість на складі" required>
              <Input
                name="stock"
                placeholder="0"
                type="number"
                min="0"
                value={product.stock}
                onChange={handleChange}
                className="rounded-xl"
                disabled={product.variants.length > 0}
                title={
                  product.variants.length > 0
                    ? "Розраховується автоматично з варіантів"
                    : ""
                }
              />
              {product.variants.length > 0 && (
                <p className="text-xs text-gray-400 -mt-1">
                  Автоматично = сума варіантів:{" "}
                  <span className="font-semibold">
                    {product.variants.reduce(
                      (s, v) => s + (parseInt(v.stock) || 0),
                      0,
                    )}{" "}
                    шт
                  </span>
                </p>
              )}
            </Field>
            <Field label="Категорія" required>
              <Select
                value={product.categoryId}
                onValueChange={(v) =>
                  setProduct((p) => ({ ...p, categoryId: v }))
                }
              >
                <SelectTrigger className="rounded-xl cursor-pointer">
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="cursor-pointer"
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Статус">
              <Select
                value={product.isActive ? "true" : "false"}
                onValueChange={(v) =>
                  setProduct((p) => ({ ...p, isActive: v === "true" }))
                }
              >
                <SelectTrigger className="rounded-xl cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      Активний
                    </div>
                  </SelectItem>
                  <SelectItem value="false" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600 shrink-0" />
                      Неактивний
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        {/* ── Крок 3: Варіанти ── */}
        <Section
          step={3}
          title="Варіанти"
          icon={<Layers size={16} />}
          done={step3Done}
        >
          <p className="text-xs text-gray-400 -mt-1">
            Розмір, колір та кількість для кожного варіанту
          </p>

          {product.variants.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-[1fr_1fr_80px_36px] gap-2 px-1">
                {["Розмір", "Колір", "К-сть", ""].map((h) => (
                  <span
                    key={h}
                    className="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </span>
                ))}
              </div>
              {product.variants.map((v, i) => (
                <div
                  key={v.id ?? i}
                  className="grid grid-cols-[1fr_1fr_80px_36px] gap-2 items-center"
                >
                  <Input
                    placeholder="XL"
                    value={v.size}
                    onChange={(e) => updateVariant(i, "size", e.target.value)}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Чорний"
                    value={v.color}
                    onChange={(e) => updateVariant(i, "color", e.target.value)}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="0"
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, "stock", e.target.value)}
                    className="rounded-xl"
                  />
                  <button
                    onClick={() => removeVariant(i)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addVariant}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white w-fit transition-colors group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full border border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center group-hover:border-gray-500 dark:group-hover:border-zinc-400 transition-colors">
              <Plus size={13} />
            </div>
            Додати варіант
          </button>
        </Section>

        {/* ── Кнопки ── */}
        <div className="flex gap-2.5 pb-4">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-11 cursor-pointer"
            onClick={() => router.push(`/dashboard/warehouse/${id}`)}
            disabled={saving}
          >
            Скасувати
          </Button>
          <Button
            className="flex-1 rounded-2xl h-11 font-medium cursor-pointer"
            onClick={handleSubmit}
            disabled={saving || !step1Done || !step2Done}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Збереження...
              </span>
            ) : (
              "Зберегти продукт"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
