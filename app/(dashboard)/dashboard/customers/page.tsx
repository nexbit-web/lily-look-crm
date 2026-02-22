"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  orders?: { id: string }[];
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => toast.error("Не вдалося завантажити клієнтів"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
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
      {/* Тулбар */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-bold">Клієнти ({customers.length})</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Пошук за ім'ям, телефоном..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/customers/add")}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden lg:inline">Новий клієнт</span>
          </Button>
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader className="bg-input dark:bg-input sticky top-0 z-10">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Ім'я</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Замовлення</TableHead>
              <TableHead>Дата реєстрації</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-gray-400"
                >
                  Клієнтів не знайдено
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((customer, index) => (
                <TableRow key={customer.id}>
                  <TableCell className="text-xs text-gray-400 font-mono">
                    {(page - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/customers/${customer.id}`)
                      }
                      className="font-medium hover:underline text-left cursor-pointer"
                    >
                      {customer.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {customer.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {customer.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {customer.orders?.length ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString("uk-UA")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
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
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
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
              className="hidden h-8 w-8 lg:flex"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex"
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
