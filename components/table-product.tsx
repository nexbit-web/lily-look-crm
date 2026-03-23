"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import ProductActions from "@/components/Product-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = { id: string; size: string; color: string; stock: number };
type Product = {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  sku: string;
  category: { id: string; name: string; slug: string };
  variants: Variant[];
};

// Реальний залишок — сума варіантів або stock продукту
const getRealStock = (p: Product) =>
  p.variants?.length > 0
    ? p.variants.reduce((s, v) => s + v.stock, 0)
    : p.stock;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductsTable() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => toast.error("Не вдалося завантажити продукти"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Помилка видалення");
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/warehouse/${id}/edit`);
    },
    [router],
  );

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* ── Тулбар ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-bold">Товари ({products.length})</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <Input
              placeholder="Пошук за назвою або SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-8 max-w-xs"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <RoleGate allowed={["MANAGER", "ADMIN"]}>
            <Button
              size="sm"
              className="cursor-pointer"
              onClick={() => router.push("/dashboard/warehouse/add")}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden lg:inline">Новий товар</span>
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* ── Таблиця ── */}
      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader className="bg-input dark:bg-input sticky top-0 z-10">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Назва</TableHead>
              <TableHead>Артикул</TableHead>
              <TableHead>Ціна</TableHead>
              <TableHead>
                <RoleGate allowed={["OWNER", "ADMIN", "MANAGER"]}>
                  Маржа
                </RoleGate>
              </TableHead>

              <TableHead>На складі</TableHead>
              <TableHead>Категорія</TableHead>
              <TableHead>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-gray-400"
                >
                  Продуктів не знайдено
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((product, index) => {
                const stock = getRealStock(product);
                const hasVariants = product.variants?.length > 0;
                const availableV =
                  product.variants?.filter((v) => v.stock > 0).length ?? 0;

                return (
                  <TableRow key={product.id}>
                    <TableCell className="text-xs text-gray-400 font-mono">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>

                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/warehouse/${product.id}`}
                        className="hover:underline cursor-pointer"
                      >
                        {product.name}
                      </Link>
                    </TableCell>

                    <TableCell className="text-gray-500 font-mono text-xs">
                      {product.sku}
                    </TableCell>

                    <TableCell className="font-medium tabular-nums">
                      {product.price} ₴
                    </TableCell>

                    {/* ← ДОБАВИТЬ */}
                    <TableCell>
                      <RoleGate allowed={["OWNER", "ADMIN", "MANAGER"]}>
                        {product.costPrice > 0 ? (
                          (() => {
                            const profit = product.price - product.costPrice;
                            const margin = (
                              (profit / product.price) *
                              100
                            ).toFixed(0);
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className={`text-xs font-semibold tabular-nums ${
                                    profit >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-500"
                                  }`}
                                >
                                  {profit >= 0 ? "+" : ""}
                                  {profit.toFixed(0)} ₴
                                </span>
                                <span className="text-xs text-gray-400 tabular-nums">
                                  {margin}%
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-xs text-gray-300 dark:text-zinc-600">
                            —
                          </span>
                        )}
                      </RoleGate>
                    </TableCell>

                    {/* На складі — реальний залишок з кольором */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            stock === 0
                              ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : stock <= 5
                                ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                                : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                          }
                        >
                          {stock} шт
                        </Badge>
                        {hasVariants && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {availableV}/{product.variants.length} вар.
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-gray-500">
                      {product.category?.name ?? "—"}
                    </TableCell>

                    <TableCell>
                      <RoleGate allowed={["MANAGER", "ADMIN"]}>
                        <ProductActions
                          productId={product.id}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                        />
                      </RoleGate>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Пагінація ── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-muted-foreground text-sm">
          Всього: {filtered.length}
        </span>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 lg:flex">
            <Label className="text-sm font-medium">Рядків</Label>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm font-medium">
            {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex cursor-pointer"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex cursor-pointer"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
