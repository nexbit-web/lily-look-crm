"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleGate } from "@/components/Role-gate";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderProduct = { name: string };

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: OrderProduct;
};

type OrderCustomer = { id: string; name: string };
type OrderManager = { id: string; name: string };

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  customer: OrderCustomer;
  manager: OrderManager | null;
  items: OrderItem[];
};

type StatusKey =
  | "NEW"
  | "CONFIRMED"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELED"
  | "RETURNED";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<StatusKey, string> = {
  NEW: "Новий",
  CONFIRMED: "Підтверджено",
  SHIPPED: "Відправлено",
  COMPLETED: "Виконано",
  CANCELED: "Скасовано",
  RETURNED: "Повернено",
};

const STATUS_COLORS: Record<StatusKey, string> = {
  NEW: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  CONFIRMED:
    "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  SHIPPED: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  CANCELED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  RETURNED:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
};

// ─── OrdersTable ──────────────────────────────────────────────────────────────

export function OrdersTable() {
  const router = useRouter();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  const fetchOrders = React.useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data: Order[] = await res.json();
      setOrders(data);
    } catch {
      toast.error("Не вдалося завантажити замовлення");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated: Order = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSelectedOrder(null);
      toast.success("Статус оновлено");
    } catch {
      toast.error("Не вдалося оновити статус");
    }
  };

  const filtered = React.useMemo(
    () =>
      orders.filter(
        (o) =>
          o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          o.id.toLowerCase().includes(search.toLowerCase()),
      ),
    [orders, search],
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
        <h1 className="text-xl font-bold">Замовлення ({orders.length})</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <Input
              placeholder="Пошук за клієнтом..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/orders/add")}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden lg:inline">Нове замовлення</span>
          </Button>
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader className="bg-input dark:bg-input sticky top-0 z-10">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Клієнт</TableHead>
              <TableHead>Менеджер</TableHead>
              <TableHead>Товари</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Сума</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-gray-400"
                >
                  Замовлень не знайдено
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((order, index) => {
                const status = order.status as StatusKey;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs text-gray-400 font-mono">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>

                    {/* Клиент — клик открывает drawer */}
                    <TableCell>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="font-medium hover:underline text-left cursor-pointer"
                      >
                        {order.customer.name}
                      </button>
                    </TableCell>

                    <TableCell className="text-gray-500">
                      {order.manager?.name ?? "—"}
                    </TableCell>

                    <TableCell className="text-sm text-gray-500">
                      {order.items.length} поз.
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={STATUS_COLORS[order.status as StatusKey]}
                      >
                        {STATUS_LABELS[order.status as StatusKey]}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-medium">
                      {order.total} ₴
                    </TableCell>

                    <TableCell className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("uk-UA")}
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* Drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

// ─── OrderDrawer ──────────────────────────────────────────────────────────────

function OrderDrawer({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderId: string, status: string) => Promise<void>;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer
      open={!!order}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent>
        {order && (
          <>
            <DrawerHeader className="gap-1">
              <DrawerTitle>
                <Link
                  href={`/dashboard/customers/${order.customer.id}`}
                  className="hover:underline"
                >
                  {order.customer.name}
                </Link>
              </DrawerTitle>
              <DrawerDescription>
                Замовлення ·{" "}
                {new Date(order.createdAt).toLocaleDateString("uk-UA")}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
              {/* Статус — тільки для MANAGER/ADMIN */}
              <RoleGate allowed={["MANAGER", "ADMIN"]}>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    Статус замовлення
                  </Label>
                  <Select
                    value={order.status}
                    onValueChange={(v) => onStatusChange(order.id, v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <Badge
                          className={STATUS_COLORS[order.status as StatusKey]}
                        >
                          {STATUS_LABELS[order.status as StatusKey]}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(STATUS_LABELS) as [StatusKey, string][]
                      ).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          <Badge className={STATUS_COLORS[val]}>{label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </RoleGate>
              {/* Статус тільки для перегляду — для інших ролей */}
              <RoleGate allowed={["EMPLOYEE", "INTERN"]}>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    Статус замовлення
                  </Label>
                  <Badge
                    className={`w-fit ${STATUS_COLORS[order.status as StatusKey]}`}
                  >
                    {STATUS_LABELS[order.status as StatusKey]}
                  </Badge>
                </div>
              </RoleGate>

              {/* Менеджер */}
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-400">Менеджер</Label>
                <span className="text-sm font-medium">
                  {order.manager?.name ?? "—"}
                </span>
              </div>

              {/* Товари */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Товари</Label>
                <div className="flex flex-col gap-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border p-3 bg-gray-50 dark:bg-zinc-900"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.price} ₴ × {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">
                        {(item.price * item.quantity).toFixed(0)} ₴
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Итого */}
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-sm text-gray-500">Загальна сума</span>
                <span className="text-lg font-bold">{order.total} ₴</span>
              </div>
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Закрити</Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
