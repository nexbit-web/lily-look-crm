"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  format, startOfMonth, endOfMonth,
  isWithinInterval, parseISO,
} from "date-fns";
import { uk } from "date-fns/locale";
import {
  Plus, Search, X, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, CalendarIcon,
  TrendingDown, ArrowUpRight, ArrowDownRight, Trash,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  Card, CardAction, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { RoleGate } from "@/components/Role-gate";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpenseCategory =
  | "ADVERTISING" | "PHOTOGRAPHER" | "DELIVERY"
  | "SALARY" | "DISCOUNT_LOSS" | "PURCHASE" | "BANK_FEE" | "OTHER";

type Expense = {
  id: string;
  category: ExpenseCategory;
  amount: string;
  description: string | null;
  date: string;
  createdBy: { id: string; name: string };
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ADVERTISING: "Реклама", PHOTOGRAPHER: "Фотограф", DELIVERY: "Доставка",
  SALARY: "Зарплата", DISCOUNT_LOSS: "Товар зі знижкою",
  PURCHASE: "Закупка товарів", BANK_FEE: "Відсоток банку", OTHER: "Інше",
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  ADVERTISING:   "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  PHOTOGRAPHER:  "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  DELIVERY:      "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  SALARY:        "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  DISCOUNT_LOSS: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  PURCHASE:      "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  BANK_FEE:      "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  OTHER:         "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300",
};

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, trend }: {
  label: string; value: string; sub?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {trend && (
          <CardAction>
            <Badge variant="outline" className={cn(
              trend.positive
                ? "text-green-600 border-green-200 dark:border-green-800"
                : "text-red-500 border-red-200 dark:border-red-800"
            )}>
              {trend.positive ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
              {trend.value}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {trend && (
          <div className={cn("line-clamp-1 flex gap-2 font-medium",
            trend.positive ? "text-green-600" : "text-red-500")}>
            {trend.positive ? "Менше ніж минулий місяць" : "Більше ніж минулий місяць"}
            {trend.positive ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
          </div>
        )}
        {sub && <div className="text-muted-foreground">{sub}</div>}
      </CardFooter>
    </Card>
  );
}

// ─── DateRangePicker ──────────────────────────────────────────────────────────

function DateRangePicker({ value, onChange }: {
  value: DateRange | undefined; onChange: (r: DateRange | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn(
          "justify-start font-normal rounded-xl h-9 gap-2 text-sm",
          !value && "text-muted-foreground"
        )}>
          <CalendarIcon size={14} className="shrink-0"/>
          {value?.from
            ? value.to
              ? <>{format(value.from,"dd.MM.yy")} — {format(value.to,"dd.MM.yy")}</>
              : format(value.from,"dd.MM.yyyy")
            : "Оберіть період"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
        <Calendar mode="range" selected={value} onSelect={onChange} locale={uk} numberOfMonths={2} initialFocus/>
        <div className="flex gap-2 p-3 border-t border-gray-100 dark:border-zinc-800">
          <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs cursor-pointer"
            onClick={() => { const n=new Date(); onChange({from:startOfMonth(n),to:endOfMonth(n)}); }}>
            Цей місяць
          </Button>
          <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs cursor-pointer"
            onClick={() => { const p=new Date(new Date().getFullYear(),new Date().getMonth()-1,1); onChange({from:startOfMonth(p),to:endOfMonth(p)}); }}>
            Минулий місяць
          </Button>
          <Button size="sm" variant="ghost" className="rounded-xl text-xs text-gray-400 cursor-pointer"
            onClick={() => onChange(undefined)}>
            Скинути
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("ALL");
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(10);
  const [dateRange, setDateRange]   = useState<DateRange | undefined>(() => ({
    from: startOfMonth(new Date()), to: endOfMonth(new Date()),
  }));

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses");
      setExpenses(await res.json());
    } catch { toast.error("Не вдалося завантажити витрати"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { setPage(1); }, [search, filterCat, dateRange]);

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити витрату?")) return;
    setDeletingId(id);
    try {
      await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success("Видалено");
    } catch { toast.error("Помилка"); }
    finally { setDeletingId(null); }
  };

  const filtered = useMemo(() => expenses.filter(e => {
    if (dateRange?.from || dateRange?.to) {
      const d=parseISO(e.date), from=dateRange.from??new Date(0), to=dateRange.to??new Date(9999,11,31);
      if (!isWithinInterval(d,{start:from,end:to})) return false;
    }
    if (filterCat!=="ALL" && e.category!==filterCat) return false;
    if (search) {
      const q=search.toLowerCase();
      return CATEGORY_LABELS[e.category].toLowerCase().includes(q)||
        (e.description??"").toLowerCase().includes(q)||
        e.createdBy.name.toLowerCase().includes(q);
    }
    return true;
  }), [expenses, search, filterCat, dateRange]);

  const totalAll      = useMemo(() => expenses.reduce((s,e)=>s+parseFloat(e.amount),0),[expenses]);
  const totalFiltered = useMemo(() => filtered.reduce((s,e)=>s+parseFloat(e.amount),0),[filtered]);
  const currMonth = useMemo(() => {
    const n=new Date();
    return expenses.filter(e=>isWithinInterval(parseISO(e.date),{start:startOfMonth(n),end:endOfMonth(n)}))
      .reduce((s,e)=>s+parseFloat(e.amount),0);
  },[expenses]);
  const prevMonth = useMemo(() => {
    const p=new Date(new Date().getFullYear(),new Date().getMonth()-1,1);
    return expenses.filter(e=>isWithinInterval(parseISO(e.date),{start:startOfMonth(p),end:endOfMonth(p)}))
      .reduce((s,e)=>s+parseFloat(e.amount),0);
  },[expenses]);

  const trendPct = prevMonth>0 ? (((currMonth-prevMonth)/prevMonth)*100).toFixed(1) : null;
  const totalPages = Math.max(1, Math.ceil(filtered.length/pageSize));
  const paginated  = filtered.slice((page-1)*pageSize, page*pageSize);

  if (loading)
    return <div className="flex min-h-[80vh] items-center justify-center"><Spinner className="h-6 w-6"/></div>;

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Метрики ── */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-4">
        <MetricCard label="Всього витрат" value={`${totalAll.toFixed(0)} ₴`} sub={`${expenses.length} записів`}/>
        <MetricCard label="Цей місяць" value={`${currMonth.toFixed(0)} ₴`}
          trend={trendPct ? {value:`${Math.abs(Number(trendPct))}% vs минулий місяць`,positive:Number(trendPct)<=0} : undefined}/>
        <MetricCard label="Минулий місяць" value={`${prevMonth.toFixed(0)} ₴`} sub="для порівняння"/>
        <MetricCard label="За обраний період" value={`${totalFiltered.toFixed(0)} ₴`} sub={`${filtered.length} записів`}/>
      </div>

      {/* ── Тулбар ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-bold">Витрати ({expenses.length})</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker value={dateRange} onChange={setDateRange}/>

          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="h-9 rounded-xl text-sm w-40"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Всі категорії</SelectItem>
              {(Object.entries(CATEGORY_LABELS) as [ExpenseCategory,string][]).map(([v,l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            <Input placeholder="Пошук..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-8 max-w-xs h-9"/>
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer transition-colors">
                <X size={14}/>
              </button>
            )}
          </div>

          <RoleGate allowed={["OWNER","ADMIN","MANAGER"]}>
            <Button size="sm" className="cursor-pointer"
              onClick={() => router.push("/dashboard/expenses/add")}>
              <Plus className="h-4 w-4 mr-1"/>
              <span className="hidden lg:inline">Додати витрату</span>
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
              <TableHead>Дата</TableHead>
              <TableHead>Категорія</TableHead>
              <TableHead>Опис</TableHead>
              <TableHead>Хто додав</TableHead>
              <TableHead className="text-right">Сума</TableHead>
              <TableHead/>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-1">
                    <TrendingDown size={28} strokeWidth={1.5} className="text-gray-200 dark:text-zinc-700"/>
                    <span>Витрат за цей період не знайдено</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((expense, index) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-xs text-gray-400 font-mono">
                    {(page-1)*pageSize+index+1}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 tabular-nums whitespace-nowrap">
                    {format(parseISO(expense.date),"dd.MM.yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge className={CATEGORY_COLORS[expense.category]}>
                      {CATEGORY_LABELS[expense.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-[180px] truncate">
                    {expense.description ?? <span className="text-gray-300 dark:text-zinc-600">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {expense.createdBy.name}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {parseFloat(expense.amount).toFixed(0)} ₴
                  </TableCell>
                  <TableCell>
                    <RoleGate allowed={["OWNER","ADMIN","MANAGER"]}>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId===expense.id}
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer disabled:opacity-40"
                      >
                        {deletingId===expense.id
                          ? <Spinner className="h-3.5 w-3.5"/>
                          : <Trash size={13}/>
                        }
                      </button>
                    </RoleGate>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Пагінація ── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-muted-foreground text-sm">Всього: {filtered.length}</span>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 lg:flex">
            <Label className="text-sm font-medium">Рядків</Label>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger size="sm" className="w-20"><SelectValue/></SelectTrigger>
              <SelectContent side="top">
                {[10,20,50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm font-medium">{page} / {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="hidden h-8 w-8 lg:flex cursor-pointer"
              onClick={() => setPage(1)} disabled={page===1}>
              <ChevronsLeft className="h-4 w-4"/>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer"
              onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>
              <ChevronLeft className="h-4 w-4"/>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer"
              onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>
              <ChevronRight className="h-4 w-4"/>
            </Button>
            <Button variant="outline" size="icon" className="hidden h-8 w-8 lg:flex cursor-pointer"
              onClick={() => setPage(totalPages)} disabled={page===totalPages}>
              <ChevronsRight className="h-4 w-4"/>
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}