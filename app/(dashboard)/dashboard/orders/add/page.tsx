"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  X,
  UserPlus,
  Plus,
  Trash,
  ChevronDown,
  User,
  ShoppingBag,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};
type ProductVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};
type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  variants: ProductVariant[];
};
type OrderItem = {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  maxStock: number;
  variantLabel: string | null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [variantDialog, setVariantDialog] = useState<Product | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([c, p]) => {
        setCustomers(c);
        setProducts(
          p.filter(
            (prod: Product) =>
              prod.stock > 0 ||
              prod.variants?.some((v: ProductVariant) => v.stock > 0),
          ),
        );
        const customerId = searchParams.get("customerId");
        if (customerId) {
          const found = c.find((cu: Customer) => cu.id === customerId);
          if (found) setSelectedCustomer(found);
        }
      })
      .catch(() => toast.error("Не вдалося завантажити дані"))
      .finally(() => setLoadingData(false));
  }, [searchParams]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch),
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const handleProductClick = (product: Product) => {
    if (product.variants?.length > 0) {
      setVariantDialog(product);
    } else {
      addItemDirect(product, null, null, product.stock);
    }
    setProductSearch("");
  };

  const handleVariantSelect = (product: Product, variant: ProductVariant) => {
    addItemDirect(
      product,
      variant.id,
      `${variant.size} · ${variant.color}`,
      variant.stock,
    );
    setVariantDialog(null);
  };

  const addItemDirect = (
    product: Product,
    variantId: string | null,
    variantLabel: string | null,
    maxStock: number,
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) =>
        variantId
          ? i.variantId === variantId
          : i.productId === product.id && !i.variantId,
      );
      if (existing) {
        if (existing.quantity >= maxStock) {
          toast.error(`Максимум ${maxStock} шт на складі`);
          return prev;
        }
        return prev.map((i) =>
          (
            variantId
              ? i.variantId === variantId
              : i.productId === product.id && !i.variantId
          )
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
          maxStock,
          variantLabel,
        },
      ];
    });
  };

  const updateQty = (index: number, qty: number) => {
    if (qty < 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    const item = items[index];
    if (qty > item.maxStock) {
      toast.error(`Максимум ${item.maxStock} шт на складі`);
      return;
    }
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item)),
    );
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error("Оберіть клієнта");
      return;
    }
    if (!items.length) {
      toast.error("Додайте хоча б один товар");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Замовлення створено!");
      router.push("/dashboard/orders");
    } catch (error: any) {
      toast.error(error.message || "Помилка");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );

  const step1Done = !!selectedCustomer;
  const step2Done = items.length > 0;

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 flex flex-col gap-6">
        {/* ── Шапка ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Нове замовлення
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Заповніть кроки нижче
            </p>
          </div>
        </div>

        {/* ── Крок 1: Клієнт ── */}
        <Section
          step={1}
          title="Клієнт"
          icon={<User size={16} />}
          done={step1Done}
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
              <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {selectedCustomer.name[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {selectedCustomer.name}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedCustomer.phone ?? selectedCustomer.email ?? "—"}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white dark:hover:bg-zinc-800 transition-all shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="Ім'я або телефон клієнта..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>

              {customerSearch && (
                <div className="border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-gray-400 text-center">
                      Клієнта не знайдено
                    </div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch("");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/60 border-b border-gray-50 dark:border-zinc-800 last:border-0 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-gray-500">
                            {c.name[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-gray-400">
                            {c.phone ?? c.email ?? "—"}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              <button
                onClick={() =>
                  router.push(
                    `/dashboard/customers/add?returnTo=/dashboard/orders/add`,
                  )
                }
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white w-fit transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full border border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center group-hover:border-gray-500 transition-colors">
                  <UserPlus size={13} />
                </div>
                Додати нового клієнта
              </button>
            </div>
          )}
        </Section>

        {/* ── Крок 2: Товари ── */}
        <Section
          step={2}
          title="Товари"
          icon={<ShoppingBag size={16} />}
          done={step2Done}
          dimmed={!step1Done}
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Назва або SKU товару..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-9 rounded-xl"
              disabled={!step1Done}
            />
          </div>

          {productSearch && (
            <div className="border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm mt-1">
              {filteredProducts.length === 0 ? (
                <div className="px-4 py-5 text-sm text-gray-400 text-center">
                  Не знайдено або немає на складі
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const hasVariants = p.variants?.length > 0;
                  const availableVariants =
                    p.variants?.filter((v) => v.stock > 0).length ?? 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProductClick(p)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/60 border-b border-gray-50 dark:border-zinc-800 last:border-0 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.sku}
                          <span className="mx-1.5 text-gray-300 dark:text-zinc-600">
                            ·
                          </span>
                          {hasVariants
                            ? `${availableVariants} варіант${availableVariants === 1 ? "" : "и"}`
                            : `${p.stock} шт`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-sm font-semibold">
                          {p.price} ₴
                        </span>
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                          {hasVariants ? (
                            <ChevronDown size={13} className="text-gray-500" />
                          ) : (
                            <Plus size={13} className="text-gray-500" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Добавленные позиции */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  {/* Левая часть */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      {item.variantLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 font-medium">
                          {item.variantLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.price} ₴ × {item.quantity}
                      <span className="mx-1 text-gray-300 dark:text-zinc-600">
                        =
                      </span>
                      <span className="font-semibold text-gray-700 dark:text-zinc-300">
                        {(item.price * item.quantity).toFixed(0)} ₴
                      </span>
                    </p>
                  </div>

                  {/* Счётчик */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQty(index, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 text-base leading-none transition-colors cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-6 text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(index, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="w-7 h-7 rounded-full border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 text-base leading-none transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      onClick={() => updateQty(index, 0)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all ml-0.5 cursor-pointer"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && !productSearch && step1Done && (
            <div className="flex flex-col items-center gap-2 py-6 text-gray-300 dark:text-zinc-600">
              <ShoppingBag size={28} strokeWidth={1.5} />
              <p className="text-xs">Почніть вводити назву товару вище</p>
            </div>
          )}
        </Section>

        {/* ── Підсумок ── */}
        {step1Done && step2Done && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
            {/* Список позицій */}
            <div className="px-5 pt-4 pb-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                Підсумок
              </p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-2.5"
                >
                  <div>
                    <p className="text-sm">{item.name}</p>
                    {item.variantLabel && (
                      <p className="text-xs text-gray-400">
                        {item.variantLabel}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {(item.price * item.quantity).toFixed(0)} ₴
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-zinc-800">
              <span className="text-sm text-gray-500">Загальна сума</span>
              <span className="text-2xl font-bold tabular-nums">
                {total.toFixed(0)} ₴
              </span>
            </div>
          </div>
        )}

        {/* ── Кнопки ── */}
        <div className="flex gap-2.5 pb-4">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-11"
            onClick={() => router.push("/dashboard/orders")}
            disabled={submitting}
          >
            Скасувати
          </Button>
          {step1Done && step2Done && (
            <Button
              className="flex-1 rounded-2xl h-11 font-medium"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Створення..." : "Оформити замовлення"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Діалог варіантів ── */}
      <Dialog
        open={!!variantDialog}
        onOpenChange={(open) => {
          if (!open) setVariantDialog(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              {variantDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-1">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
              Оберіть варіант
            </p>
            {variantDialog?.variants
              .filter((v) => v.stock > 0)
              .map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variantDialog, variant)}
                  className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                      {variant.size}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                      {variant.color}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      variant.stock > 5
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                    }`}
                  >
                    {variant.stock} шт
                  </span>
                </button>
              ))}
            {variantDialog?.variants.filter((v) => v.stock > 0).length ===
              0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                Всі варіанти закінчились
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Section компонент ────────────────────────────────────────────────────────

function Section({
  step,
  title,
  icon,
  done,
  dimmed = false,
  children,
}: {
  step: number;
  title: string;
  icon: React.ReactNode;
  done: boolean;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-3xl border transition-all ${
        dimmed
          ? "border-gray-100 dark:border-zinc-800 opacity-50 pointer-events-none"
          : done
            ? "border-green-100 dark:border-green-900"
            : "border-gray-100 dark:border-zinc-800"
      }`}
    >
      {/* Заголовок секции */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-50 dark:border-zinc-800">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
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
      <div className="p-5 flex flex-col gap-3">{children}</div>
    </div>
  );
}
