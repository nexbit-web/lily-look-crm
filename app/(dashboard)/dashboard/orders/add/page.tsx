"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search, X, UserPlus, Plus, Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
};

type OrderItem = {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
};

// ─── AddOrderPage ─────────────────────────────────────────────────────────────

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

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([c, p]) => {
        setCustomers(c);
        setProducts(p.filter((prod: Product) => prod.stock > 0));

        // Если вернулись со страницы создания клиента — автовыбор по customerId в URL
        const customerId = searchParams.get("customerId");
        if (customerId) {
          const found = c.find(
            (customer: Customer) => customer.id === customerId,
          );
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

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
        },
      ];
    });
    setProductSearch("");
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i,
      ),
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        {/* Заголовок */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Нове замовлення
          </h1>
        </div>

        {/* ── Клиент ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 flex flex-col gap-3">
          <Label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
            Клієнт
          </Label>

          {selectedCustomer ? (
            // Выбранный клиент
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
              <div>
                <p className="font-medium text-sm">{selectedCustomer.name}</p>
                <p className="text-xs text-gray-400">
                  {selectedCustomer.phone ?? selectedCustomer.email ?? "—"}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            // Поиск клиента
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="Пошук клієнта за ім'ям або телефоном..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Результаты поиска */}
              {customerSearch && (
                <div className="border rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-sm text-gray-400 text-center">
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
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 text-sm border-b last:border-0"
                      >
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-gray-400">
                          {c.phone ?? c.email ?? "—"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Кнопка — переход на страницу создания клиента */}
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  router.push(
                    `/dashboard/customers/add?returnTo=/dashboard/orders/add`,
                  )
                }
              >
                <UserPlus size={14} className="mr-2" />
                Новий клієнт
              </Button>
            </div>
          )}
        </div>

        {/* ── Товари ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 flex flex-col gap-3">
          <Label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
            Товари
          </Label>

          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Пошук за назвою або SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {productSearch && (
            <div className="border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-3 text-sm text-gray-400 text-center">
                  Не знайдено або немає на складі
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 text-sm border-b last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.sku} · {p.stock} шт на складі
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.price} ₴</span>
                      <Plus size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {items.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.price} ₴ × {item.quantity} ={" "}
                      <strong>
                        {(item.price * item.quantity).toFixed(0)} ₴
                      </strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        updateQty(item.productId, item.quantity - 1)
                      }
                      className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQty(item.productId, item.quantity + 1)
                      }
                      className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    >
                      +
                    </button>
                    <button
                      onClick={() => updateQty(item.productId, 0)}
                      className="text-red-400 hover:text-red-600 ml-1"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && !productSearch && (
            <p className="text-sm text-gray-400 text-center py-4">
              Знайдіть і додайте товари вище
            </p>
          )}
        </div>

        {/* ── Итого + кнопки ── */}
        {items.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-gray-500">Загальна сума</span>
              <span className="text-2xl font-bold">{total.toFixed(0)} ₴</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/dashboard/orders")}
                disabled={submitting}
              >
                Скасувати
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting || !selectedCustomer || !items.length}
              >
                {submitting ? "Створення..." : "Створити замовлення"}
              </Button>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/orders")}
          >
            Скасувати
          </Button>
        )}
      </div>
    </div>
  );
}
