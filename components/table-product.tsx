"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ProductActions from "./Product-actions";
import { Spinner } from "./ui/spinner";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { RoleGate } from "./Role-gate";

type Variant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  variants: Variant[];
};

export default function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data: Product[] = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error("Не вдалося завантажити продукти");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Помилка видалення");
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const router = useRouter();

  const handleEdit = (id: string) => {
    router.push(`/dashboard/warehouse/${id}/edit`);
  };

  // Поиск
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  // Пагинация
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  if (loading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Продукти ({products.length})</h1>

      <div className="flex items-center justify-between mb-2 gap-2.5">
        <Input
          placeholder="Пошук за назвою або Артікул..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="mb-4 max-w-sm"
        />
        <RoleGate allowed={["MANAGER", "ADMIN"]}>
          {" "}
          <Button
            className="cursor-pointer"
            onClick={() => router.push("/dashboard/warehouse/add")}
          >
            <Plus className="h-4 w-4" />
            Додати
          </Button>
        </RoleGate>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-input dark:bg-input rounded-tl-2xl">
              #
            </TableHead>
            <TableHead className="bg-input dark:bg-input">Назва</TableHead>
            <TableHead className="bg-input dark:bg-input">Артікул</TableHead>
            <TableHead className="bg-input dark:bg-input">Ціна</TableHead>
            <TableHead className="bg-input dark:bg-input">Кількість</TableHead>
            <TableHead className="bg-input dark:bg-input">Варіанти</TableHead>
            <TableHead className="bg-input dark:bg-input rounded-tr-2xl">
              Дії
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                Продуктів не знайдено
              </TableCell>
            </TableRow>
          ) : (
            paginatedProducts.map((product, index) => (
              <TableRow key={product.id}>
                <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-gray-500">{product.sku}</TableCell>
                <TableCell>{product.price} грн</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  {product.variants.length === 0 ? (
                    <span className="text-gray-400 text-sm">Немає</span>
                  ) : (
                    product.variants.map((v) => (
                      <div key={v.id} className="text-sm">
                        {v.size} / {v.color} ({v.stock})
                      </div>
                    ))
                  )}
                </TableCell>
                <TableCell>
                  <ProductActions
                    productId={product.id}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* PAGINATION */}
      <div className="flex items-center justify-between gap-4 mt-4">
        <Field orientation="horizontal" className="w-fit">
          <FieldLabel>Рядків на сторінці</FieldLabel>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {[6, 10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              />
            </PaginationItem>
            <span className="px-3 text-sm">
              {page} / {totalPages || 1}
            </span>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
