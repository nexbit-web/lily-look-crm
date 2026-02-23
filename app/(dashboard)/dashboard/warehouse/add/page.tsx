"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Trash,
  RefreshCcw,
  Package,
  Tag,
  LayoutGrid,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string; slug: string };

type VariantForm = { size: string; color: string; stock: string };

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
};

const EMPTY: ProductForm = {
  name: "",
  article: "",
  description: "",
  price: "",
  stock: "",
  imageUrl: "",
  isActive: true,
  categoryId: "",
  variants: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateSKU = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

function isFormValid(p: ProductForm): boolean {
  if (
    !p.name.trim() ||
    !p.article.trim() ||
    !p.price ||
    !p.stock ||
    !p.categoryId
  )
    return false;
  if (parseFloat(p.price) <= 0 || parseInt(p.stock) < 0) return false;
  return p.variants.every(
    (v) => v.size.trim() && v.color.trim() && v.stock && parseInt(v.stock) >= 0,
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

// ─── Field wrapper ────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductForm>(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [skuSpinning, setSkuSpinning] = useState(false);
  const skuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Загрузка категорий
  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        if (cancelled) return;
        setCategories(data);
        if (data.length > 0) {
          setProduct((p) => ({ ...p, categoryId: data[0].id }));
        }
      })
      .catch(() => toast.error("Не вдалося завантажити категорії"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (skuTimeoutRef.current) clearTimeout(skuTimeoutRef.current);
    },
    [],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct((p) => ({ ...p, [name]: value }));
  }, []);

  const handleSKU = useCallback(() => {
    if (skuSpinning) return;
    setSkuSpinning(true);
    setProduct((p) => ({ ...p, article: generateSKU() }));
    skuTimeoutRef.current = setTimeout(() => setSkuSpinning(false), 600);
  }, [skuSpinning]);

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
    setProduct((p) => ({
      ...p,
      variants: p.variants.filter((_, i) => i !== index),
    }));
  }, []);

  const handleSubmit = async () => {
    if (!isFormValid(product) || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: product.name.trim(),
        description: product.description.trim() || null,
        price: parseFloat(product.price),
        sku: product.article.trim(),
        stock: parseInt(product.stock),
        imageUrl: product.imageUrl.trim() || null,
        isActive: product.isActive,
        categoryId: product.categoryId,
        variants: product.variants.map((v) => ({
          size: v.size.trim(),
          color: v.color.trim(),
          stock: parseInt(v.stock),
        })),
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Не вдалося додати продукт");
      }

      toast.success("Продукт додано!");
      router.push("/dashboard/warehouse");
    } catch (error: any) {
      toast.error(error.message || "Не вдалося додати продукт");
    } finally {
      setIsSubmitting(false);
    }
  };

  const valid = isFormValid(product);

  // Прогресс секций
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
    <div>
      <div className="max-w-2xl mx-auto px-4 flex flex-col gap-6">
        {/* ── Шапка ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/warehouse")}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Новий продукт
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Заповніть інформацію про товар
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
            <Field label="Назва *">
              <Input
                name="name"
                placeholder="Назва товару"
                value={product.name}
                onChange={handleChange}
                className="rounded-xl"
              />
            </Field>

            <Field label="Артикул (SKU) *">
              <div className="flex gap-2">
                <Input
                  name="article"
                  placeholder="000000"
                  value={product.article}
                  onChange={handleChange}
                  className="rounded-xl font-mono"
                />
                <button
                  type="button"
                  onClick={handleSKU}
                  title="Згенерувати артикул"
                  className="w-10 h-10 rounded-xl border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer shrink-0"
                >
                  <RefreshCcw
                    size={15}
                    className={skuSpinning ? "animate-spin" : ""}
                    style={{ transition: "transform 0.6s ease" }}
                  />
                </button>
              </div>
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

        {/* ── Крок 2: Ціна, склад, категорія ── */}
        <Section
          step={2}
          title="Ціна та категорія"
          icon={<Package size={16} />}
          done={step2Done}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ціна (₴) *">
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

            <Field label="Кількість на складі *">
              <Input
                name="stock"
                placeholder="0"
                type="number"
                min="0"
                value={product.stock}
                onChange={handleChange}
                className="rounded-xl"
              />
            </Field>

            <Field label="Категорія *">
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
              {/* Заголовки колонок */}
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
                  key={i}
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
            onClick={() => router.push("/dashboard/warehouse")}
            disabled={isSubmitting}
          >
            Скасувати
          </Button>
          <Button
            className="flex-1 rounded-2xl h-11 font-medium cursor-pointer"
            onClick={handleSubmit}
            disabled={!valid || isSubmitting}
          >
            {isSubmitting ? (
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
