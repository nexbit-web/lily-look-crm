"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { uk } from "date-fns/locale";
import { toast } from "react-hot-toast";
import type { DateRange } from "react-day-picker";
import { BarChart, Bar, XAxis, CartesianGrid, Rectangle } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  TrendingUp,
  TrendingDown,
  CalendarIcon,
  ShoppingBag,
  Users,
  Receipt,
  Banknote,
  XCircle,
  RotateCcw,
  Clock,
  Trophy,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Minus,
  Zap,
  Activity,
  PieChart as PieChartIcon,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalyticsData = {
  period: { from: string; to: string };
  revenue: number;
  prevRevenue: number;
  revenueGrowth: number | null;
  totalExpenses: number;
  prevTotalExp: number;
  expenseGrowth: number | null;
  netProfit: number;
  prevNetProfit: number;
  profitGrowth: number | null;
  newCustomers: number;
  prevNewCustomers: number;
  customerGrowth: number | null;
  totalOrders: number;
  completedCount: number;
  canceledCount: number;
  returnedCount: number;
  activeCount: number;
  cancelRate: number;
  expenseByCategory: Record<string, number>;
  topProducts: { id: string; name: string; qty: number; revenue: number }[];
  managersData: {
    id: string | null;
    name: string;
    role: string;
    orders: number;
    revenue: number;
  }[];
  salesChart: { date: string; revenue: number; orders: number }[];
};

const EXPENSE_LABELS: Record<string, string> = {
  ADVERTISING: "Реклама",
  PHOTOGRAPHER: "Фотограф",
  DELIVERY: "Доставка",
  SALARY: "Зарплата",
  DISCOUNT_LOSS: "Знижки",
  PURCHASE: "Закупка",
  BANK_FEE: "Банк",
  OTHER: "Інше",
};

const EXPENSE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#94a3b8",
];

const fmt = (n: number) =>
  n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");

// ─── Export ───────────────────────────────────────────────────────────────────

function exportCSV(data: AnalyticsData, dateRange?: DateRange) {
  const period =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "dd.MM.yyyy")}–${format(dateRange.to, "dd.MM.yyyy")}`
      : "Усі дати";
  const rows: string[][] = [
    ["ЗВІТ АНАЛІТИКИ"],
    ["Період:", period],
    ["Дата:", format(new Date(), "dd.MM.yyyy HH:mm")],
    [],
    ["ФІНАНСИ"],
    ["Показник", "Поточний", "Попередній", "Зміна"],
    [
      "Виручка ₴",
      fmt(data.revenue),
      fmt(data.prevRevenue),
      data.revenueGrowth !== null ? `${data.revenueGrowth}%` : "–",
    ],
    [
      "Витрати ₴",
      fmt(data.totalExpenses),
      fmt(data.prevTotalExp),
      data.expenseGrowth !== null ? `${data.expenseGrowth}%` : "–",
    ],
    [
      "Прибуток ₴",
      fmt(data.netProfit),
      fmt(data.prevNetProfit),
      data.profitGrowth !== null ? `${data.profitGrowth}%` : "–",
    ],
    [],
    ["ЗАМОВЛЕННЯ"],
    ["Всього", String(data.totalOrders)],
    ["Виконано", String(data.completedCount)],
    ["Скасовано", String(data.canceledCount)],
    [],
    ["ТОП ТОВАРИ"],
    ["Товар", "Шт", "Виручка ₴"],
    ...data.topProducts.map((p) => [p.name, String(p.qty), fmt(p.revenue)]),
    [],
    ["МЕНЕДЖЕРИ"],
    ["Ім'я", "Замовлень", "Виручка ₴"],
    ...data.managersData.map((m) => [m.name, String(m.orders), fmt(m.revenue)]),
  ];
  const csv =
    "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  a.download = `analytics_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  toast.success("CSV завантажено");
}

function exportHTML(data: AnalyticsData, dateRange?: DateRange) {
  const period =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "dd.MM.yyyy")} — ${format(dateRange.to, "dd.MM.yyyy")}`
      : "Усі дати";
  const margin =
    data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : "0";
  const html = `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><title>Звіт</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#f8fafc;color:#0f172a;padding:40px}.wrap{max-width:900px;margin:0 auto}.hero{background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;padding:36px 40px;border-radius:20px;margin-bottom:28px}.hero-tag{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#6366f1;margin-bottom:10px}.hero h1{font-size:26px;font-weight:700;letter-spacing:-0.5px;margin-bottom:4px}.hero .sub{font-size:13px;color:#94a3b8}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}.kpi{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;position:relative;overflow:hidden}.kpi::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:3px 3px 0 0}.kpi.g::after{background:#10b981}.kpi.r::after{background:#f43f5e}.kpi.b::after{background:#6366f1}.kpi.v::after{background:#8b5cf6}.kpi-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin-bottom:8px}.kpi-val{font-size:24px;font-weight:700;letter-spacing:-1px;margin-bottom:4px}.up{color:#10b981}.dn{color:#f43f5e}.nt{color:#94a3b8}.two{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}.box{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px}.box h2{font-size:14px;font-weight:700;margin-bottom:4px}.box .desc{font-size:12px;color:#94a3b8;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;padding:8px 10px;border-bottom:1px solid #f1f5f9}td{padding:11px 10px;font-size:13px;border-bottom:1px solid #f8fafc}.row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid #f8fafc}.row:last-child{border-bottom:none}.footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0}@media print{body{background:#fff}}</style></head>
<body><div class="wrap">
<div class="hero"><div class="hero-tag">CRM · Аналітичний звіт</div><h1>Фінансовий звіт</h1><div class="sub">Період: ${period} · ${format(new Date(), "dd.MM.yyyy HH:mm")}</div></div>
<div class="kpis">
  <div class="kpi g"><div class="kpi-label">Виручка</div><div class="kpi-val">${fmt(data.revenue)} ₴</div><div class="${data.revenueGrowth !== null ? (data.revenueGrowth >= 0 ? "up" : "dn") : "nt"}">${data.revenueGrowth !== null ? (data.revenueGrowth >= 0 ? "↑" : "↓") + Math.abs(data.revenueGrowth) + "%" : "–"}</div></div>
  <div class="kpi r"><div class="kpi-label">Витрати</div><div class="kpi-val">${fmt(data.totalExpenses)} ₴</div><div class="${data.expenseGrowth !== null ? (data.expenseGrowth <= 0 ? "up" : "dn") : "nt"}">${data.expenseGrowth !== null ? (data.expenseGrowth >= 0 ? "↑" : "↓") + Math.abs(data.expenseGrowth) + "%" : "–"}</div></div>
  <div class="kpi b"><div class="kpi-label">Прибуток</div><div class="kpi-val">${fmt(data.netProfit)} ₴</div><div class="${data.profitGrowth !== null ? (data.profitGrowth >= 0 ? "up" : "dn") : "nt"}">${data.profitGrowth !== null ? (data.profitGrowth >= 0 ? "↑" : "↓") + Math.abs(data.profitGrowth) + "%" : "–"}</div></div>
  <div class="kpi v"><div class="kpi-label">Клієнтів</div><div class="kpi-val">${data.newCustomers}</div><div class="${data.customerGrowth !== null ? (data.customerGrowth >= 0 ? "up" : "dn") : "nt"}">${data.customerGrowth !== null ? (data.customerGrowth >= 0 ? "↑" : "↓") + Math.abs(data.customerGrowth) + "%" : "–"}</div></div>
</div>
<div class="two">
  <div class="box"><h2>Замовлення</h2><div class="desc">Всього: ${data.totalOrders}</div>
    <div class="row"><span>✅ Виконано</span><strong>${data.completedCount}</strong></div>
    <div class="row"><span>❌ Скасовано</span><strong>${data.canceledCount}</strong></div>
    <div class="row"><span>🔄 Повернено</span><strong>${data.returnedCount}</strong></div>
    <div class="row"><span>⏳ Активні</span><strong>${data.activeCount}</strong></div>
  </div>
  <div class="box"><h2>Зведення</h2><div class="desc">Маржа: <strong style="color:${data.netProfit >= 0 ? "#10b981" : "#f43f5e"}">${margin}%</strong></div>
    <div class="row"><span>Виручка</span><strong style="color:#10b981">${fmt(data.revenue)} ₴</strong></div>
    <div class="row"><span>Витрати</span><strong style="color:#f43f5e">−${fmt(data.totalExpenses)} ₴</strong></div>
    <div class="row"><span>Прибуток</span><strong style="color:#6366f1">${fmt(data.netProfit)} ₴</strong></div>
  </div>
</div>
<div class="two">
  <div class="box"><h2>Топ товари</h2><div class="desc">За кількістю продажів</div>
    <table><tr><th>#</th><th>Товар</th><th>Шт</th><th>₴</th></tr>
    ${data.topProducts.map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.qty}</td><td>${fmt(p.revenue)}</td></tr>`).join("")}
    </table></div>
  <div class="box"><h2>Менеджери</h2><div class="desc">Рейтинг за замовленнями</div>
    <table><tr><th>#</th><th>Ім'я</th><th>Зам.</th><th>₴</th></tr>
    ${data.managersData.map((m, i) => `<tr><td>${i + 1}</td><td>${m.name}</td><td>${m.orders}</td><td>${fmt(m.revenue)}</td></tr>`).join("")}
    </table></div>
</div>
<div class="footer">CRM · ${format(new Date(), "dd.MM.yyyy HH:mm")}</div>
</div></body></html>`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([html], { type: "text/html;charset=utf-8;" }),
  );
  a.download = `analytics_${format(new Date(), "yyyy-MM-dd")}.html`;
  a.click();
  toast.success("HTML-звіт завантажено");
}

// ─── DateRangePicker ──────────────────────────────────────────────────────────

function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs rounded-full font-normal border-zinc-200 dark:border-zinc-700 px-3",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon size={12} className="text-zinc-400 shrink-0" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "dd.MM.yy")} —{" "}
                {format(value.to, "dd.MM.yy")}
              </>
            ) : (
              format(value.from, "dd.MM.yyyy")
            )
          ) : (
            "Оберіть період"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="end">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          locale={uk}
          numberOfMonths={2}
          initialFocus
        />
        <div className="flex gap-2 p-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl text-xs cursor-pointer"
            onClick={() => {
              const n = new Date();
              onChange({ from: startOfMonth(n), to: endOfMonth(n) });
            }}
          >
            Цей місяць
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl text-xs cursor-pointer"
            onClick={() => {
              const p = subMonths(new Date(), 1);
              onChange({ from: startOfMonth(p), to: endOfMonth(p) });
            }}
          >
            Минулий
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xl text-xs text-zinc-400 cursor-pointer"
            onClick={() => onChange(undefined)}
          >
            Скинути
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Growth chip — inspired by Image 16 status chips ─────────────────────────

function GrowthChip({
  value,
  inverse = false,
}: {
  value: number | null;
  inverse?: boolean;
}) {
  if (value === null)
    return <span className="text-[11px] text-zinc-400 tabular-nums">–</span>;
  const good = inverse ? value <= 0 : value >= 0;
  const Icon = good ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums",
        good
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
          : "bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400",
      )}
    >
      <Icon size={10} strokeWidth={2.5} />
      {Math.abs(value)}%
    </span>
  );
}

// ─── Status chip — exactly like Image 16 ─────────────────────────────────────

const STATUS_CFG = {
  completed: {
    label: "Виконано",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  canceled: {
    label: "Скасовано",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-500 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  returned: {
    label: "Повернено",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  active: {
    label: "Активне",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
} as const;

function StatusChip({ type }: { type: keyof typeof STATUS_CFG }) {
  const cfg = STATUS_CFG[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Chart Config ─────────────────────────────────────────────────────────────

const salesChartConfig = {
  revenue: { label: "Виручка ₴", color: "#6366f1" },
} satisfies ChartConfig;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  }));

  const fetchData = useCallback(async (range?: DateRange) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from.toISOString());
      if (range?.to) params.set("to", range.to.toISOString());
      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Не вдалося завантажити аналітику");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange]);

  if (loading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-5 w-5 text-indigo-500" />
          <span className="text-xs text-zinc-400 animate-pulse">
            Завантаження аналітики...
          </span>
        </div>
      </div>
    );
  if (!data) return null;

  const margin =
    data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : "0";

  const expenseRows = Object.entries(data.expenseByCategory)
    .map(([cat, amount], i) => ({
      name: EXPENSE_LABELS[cat] ?? cat,
      value: amount,
      color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const chartData = data.salesChart.map((d) => ({
    ...d,
    date: format(new Date(d.date), "dd.MM", { locale: uk }),
  }));

  const filteredProducts = data.topProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-zinc-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ══ PAGE HEADER — like Image 3 "Invoices" header ══ */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-zinc-400 mb-0.5 font-medium">
              Аналітика та звіти
            </p>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Фінансова аналітика
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={(v) => {
                setDateRange(v);
                fetchData(v);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-3 cursor-pointer dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  <Download size={12} />
                  Звіт
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-xl w-52 shadow-xl"
              >
                <DropdownMenuLabel className="text-xs text-zinc-400">
                  Завантажити звіт
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer rounded-lg"
                  onClick={() => exportCSV(data, dateRange)}
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                    <FileSpreadsheet
                      size={12}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium">CSV таблиця</div>
                    <div className="text-xs text-zinc-400">
                      Відкриється в Excel
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer rounded-lg"
                  onClick={() => exportHTML(data, dateRange)}
                >
                  <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                    <FileText
                      size={12}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium">HTML звіт</div>
                    <div className="text-xs text-zinc-400">Зберегти як PDF</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ══ SUMMARY STRIP — like Image 3 large payment cards ══
            Two wide cards side by side, no equal grid — asymmetric layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Revenue — wide, prominent */}
          {[
            {
              label: "Виручка",
              value: fmt(data.revenue),
              suffix: "₴",
              growth: data.revenueGrowth,
              inverse: false,
              sub: `vs ${fmt(data.prevRevenue)} ₴ попереднього`,
              iconBg: "bg-emerald-500",
              icon: Banknote,
              border: "border-l-emerald-500",
            },
            {
              label: "Витрати",
              value: fmt(data.totalExpenses),
              suffix: "₴",
              growth: data.expenseGrowth,
              inverse: true,
              sub: `vs ${fmt(data.prevTotalExp)} ₴ попереднього`,
              iconBg: "bg-rose-500",
              icon: Receipt,
              border: "border-l-rose-500",
            },
            {
              label: "Чистий прибуток",
              value: fmt(data.netProfit),
              suffix: "₴",
              growth: data.profitGrowth,
              inverse: false,
              sub: `Маржа ${margin}%`,
              iconBg: "bg-indigo-500",
              icon: TrendingUp,
              border: "border-l-indigo-500",
            },
            {
              label: "Нових клієнтів",
              value: String(data.newCustomers),
              suffix: "",
              growth: data.customerGrowth,
              inverse: false,
              sub: `vs ${data.prevNewCustomers} попереднього`,
              iconBg: "bg-violet-500",
              icon: Users,
              border: "border-l-violet-500",
            },
          ].map(
            ({
              label,
              value,
              suffix,
              growth,
              inverse,
              sub,
              iconBg,
              icon: Icon,
              border,
            }) => (
              <div
                key={label}
                className={cn(
                  "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 border-l-[3px] p-5",
                  "hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-shadow duration-200",
                  border,
                )}
              >
                {/* top row: icon + growth */}
                <div className="flex items-center justify-between mb-4">
                  {/* icon in shape — rule from Image 5 */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center",
                      iconBg,
                    )}
                  >
                    <Icon size={15} className="text-white" />
                  </div>
                  <GrowthChip value={growth} inverse={inverse} />
                </div>
                {/* big number */}
                <div className="text-[28px] font-bold tracking-tight tabular-nums leading-none mb-1">
                  {value}
                  {suffix && (
                    <span className="text-lg ml-1 font-semibold text-zinc-400">
                      {suffix}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
                  {label}
                </div>
                <div className="text-[11px] text-zinc-400 tabular-nums">
                  {sub}
                </div>
              </div>
            ),
          )}
        </div>

        {/* ══ MAIN BODY: chart (wide) + right sidebar ══
            Layout inspired by Image 3 — main content left, summary panel right */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">
            {/* Sales chart card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between px-5 pt-5 pb-0">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Activity size={13} className="text-indigo-500" />
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                      Динаміка продажів
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "dd.MM.yyyy")} — ${format(dateRange.to, "dd.MM.yyyy")}`
                      : "Усі дати"}
                  </p>
                </div>
                {data.revenueGrowth !== null && (
                  <span
                    className={cn(
                      "text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full",
                      data.revenueGrowth >= 0
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400",
                    )}
                  >
                    {data.revenueGrowth >= 0 ? (
                      <TrendingUp size={11} />
                    ) : (
                      <TrendingDown size={11} />
                    )}
                    {Math.abs(data.revenueGrowth)}% vs попередній
                  </span>
                )}
              </div>
              <div className="px-2 pb-4 pt-3">
                {chartData.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-zinc-400 text-sm">
                    Немає даних
                  </div>
                ) : (
                  <ChartContainer
                    config={salesChartConfig}
                    className="h-[200px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={chartData}
                      barSize={chartData.length > 20 ? 5 : 12}
                    >
                      <CartesianGrid vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={8}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                      />
                      <ChartTooltip
                        cursor={{ fill: "rgba(99,102,241,0.05)", radius: 6 }}
                        content={
                          <ChartTooltipContent
                            formatter={(v) => [
                              `${Number(v).toFixed(0)} ₴`,
                              "Виручка",
                            ]}
                          />
                        }
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#6366f1"
                        radius={[5, 5, 0, 0]}
                        activeBar={({ ...props }) => (
                          <Rectangle {...props} fill="#818cf8" />
                        )}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>
            </div>

            {/* Top Products — like Image 3 table with search & filters */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              {/* Table header — exactly like Image 3 search row */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Package size={13} className="text-zinc-400" />
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    Топ товари
                  </span>
                  <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full tabular-nums">
                    {data.topProducts.length}
                  </span>
                </div>
                {/* search — like Image 3 */}
                <div className="relative">
                  <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  />
                  <Input
                    placeholder="Пошук товару..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-7 pl-7 pr-3 text-xs rounded-full border-zinc-200 dark:border-zinc-700 w-40 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
              </div>
              {/* Table head — like Image 11 */}
              <div className="grid grid-cols-[auto_1fr_80px_100px] items-center px-5 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 w-8">
                  #
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Товар
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 text-center">
                  Кількість
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 text-right">
                  Виручка
                </span>
              </div>
              {filteredProducts.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-sm text-zinc-400">
                  Нічого не знайдено
                </div>
              ) : (
                filteredProducts.map((p, i) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[auto_1fr_80px_100px] items-center px-5 py-3 border-b border-zinc-50 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                    {/* rank — icon in shape (Image 5 principle) */}
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                        i === 0
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                          : i === 1
                            ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                            : i === 2
                              ? "bg-orange-50 text-orange-400"
                              : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800/50",
                      )}
                    >
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </div>
                    <div className="min-w-0 pl-3">
                      <p className="text-sm font-medium truncate text-zinc-800 dark:text-zinc-100">
                        {p.name}
                      </p>
                    </div>
                    {/* qty badge — like Image 8 status pill */}
                    <div className="flex justify-center">
                      <span className="text-xs font-semibold tabular-nums text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        {p.qty} шт
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
                        {fmt(p.revenue)} ₴
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Managers — table style */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Trophy size={13} className="text-amber-500" />
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    Менеджери
                  </span>
                </div>
                <span className="text-xs text-zinc-400">
                  За кількістю замовлень
                </span>
              </div>
              <div className="grid grid-cols-[auto_1fr_120px_100px] items-center px-5 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 w-8">
                  #
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Менеджер
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 text-center">
                  Замовлень
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 text-right">
                  Виручка
                </span>
              </div>
              {data.managersData.length === 0 ? (
                <div className="h-20 flex items-center justify-center text-sm text-zinc-400">
                  Немає даних
                </div>
              ) : (
                data.managersData.map((m, i) => {
                  const max = data.managersData[0]?.orders ?? 1;
                  const pct = (m.orders / max) * 100;
                  return (
                    <div
                      key={m.id ?? i}
                      className="grid grid-cols-[auto_1fr_120px_100px] items-center px-5 py-3 border-b border-zinc-50 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                          i === 0
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                            : i === 1
                              ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                              : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800/50",
                        )}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0 pl-3">
                        <p className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-100">
                          {m.name}
                        </p>
                        {/* inline progress bar */}
                        <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1.5 w-32">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              i === 0
                                ? "bg-indigo-500"
                                : "bg-zinc-300 dark:bg-zinc-600",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <span className="text-xs font-bold tabular-nums text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                          {m.orders}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
                          {fmt(m.revenue)} ₴
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR — like Image 3 summary panel / Image 9 detail card ── */}
          <div className="space-y-4">
            {/* Order statuses — compact card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    Замовлення
                  </span>
                  <span className="text-xs font-bold tabular-nums text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {data.totalOrders} всього
                  </span>
                </div>
              </div>
              {/* Status chips like Image 16 — one per row with count */}
              <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {[
                  {
                    type: "completed" as const,
                    val: data.completedCount,
                    icon: CheckCircle2,
                  },
                  {
                    type: "active" as const,
                    val: data.activeCount,
                    icon: Clock,
                  },
                  {
                    type: "canceled" as const,
                    val: data.canceledCount,
                    icon: XCircle,
                  },
                  {
                    type: "returned" as const,
                    val: data.returnedCount,
                    icon: RotateCcw,
                  },
                ].map(({ type, val, icon: Icon }) => {
                  const pct =
                    data.totalOrders > 0 ? (val / data.totalOrders) * 100 : 0;
                  const cfg = STATUS_CFG[type];
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      {/* status chip — Image 16 style */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                          cfg.bg,
                          cfg.text,
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            cfg.dot,
                          )}
                        />
                        {cfg.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", cfg.dot)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold tabular-nums text-zinc-700 dark:text-zinc-300 w-6 text-right">
                          {val}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Відсоток відмов</span>
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    data.cancelRate > 20
                      ? "text-rose-500"
                      : "text-zinc-600 dark:text-zinc-300",
                  )}
                >
                  {data.cancelRate}%
                </span>
              </div>
            </div>

            {/* Financial summary — like Image 9 metadata rows */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  Зведення
                </span>
              </div>
              {/* rows — exactly like Image 9: icon + label + value */}
              <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {[
                  {
                    icon: Banknote,
                    label: "Виручка",
                    value: `${fmt(data.revenue)} ₴`,
                    valueColor: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    icon: Receipt,
                    label: "Витрати",
                    value: `−\u202f${fmt(data.totalExpenses)} ₴`,
                    valueColor: "text-rose-500",
                  },
                  {
                    icon: TrendingUp,
                    label: "Прибуток",
                    value: `${fmt(data.netProfit)} ₴`,
                    valueColor:
                      data.netProfit >= 0
                        ? "text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-rose-600 font-bold",
                  },
                  {
                    icon: Users,
                    label: "Нових клієнтів",
                    value: String(data.newCustomers),
                    valueColor: "text-violet-600 dark:text-violet-400",
                  },
                  {
                    icon: Clock,
                    label: "Активних зам.",
                    value: String(data.activeCount),
                    valueColor: "text-blue-600 dark:text-blue-400",
                  },
                ].map(({ icon: RowIcon, label, value, valueColor }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* icon in shape — Image 5 */}
                      <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <RowIcon
                          size={12}
                          className="text-zinc-500 dark:text-zinc-400"
                        />
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {label}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        valueColor,
                      )}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              {/* Margin — progress bar at bottom */}
              {data.revenue > 0 && (
                <div className="px-4 py-4 border-t border-zinc-50 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Zap size={11} className="text-zinc-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Маржа
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-base font-bold tabular-nums",
                        data.netProfit >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-500",
                      )}
                    >
                      {margin}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        data.netProfit >= 0
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-rose-500",
                      )}
                      style={{
                        width: `${Math.min(100, Math.max(0, parseFloat(margin)))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Expenses — compact sidebar list */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <PieChartIcon size={13} className="text-zinc-400" />
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    Витрати
                  </span>
                </div>
                <span className="text-xs font-bold tabular-nums text-zinc-500">
                  {fmt(data.totalExpenses)} ₴
                </span>
              </div>
              {expenseRows.length === 0 ? (
                <div className="h-16 flex items-center justify-center text-xs text-zinc-400">
                  Витрат не знайдено
                </div>
              ) : (
                <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                  {expenseRows.map((item) => {
                    const pct =
                      data.totalExpenses > 0
                        ? (item.value / data.totalExpenses) * 100
                        : 0;
                    return (
                      <div key={item.name} className="px-4 py-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {/* colored square — cleaner than dot */}
                            <div
                              className="w-2 h-2 rounded-[2px] shrink-0"
                              style={{ background: item.color }}
                            />
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400 tabular-nums">
                              {pct.toFixed(0)}%
                            </span>
                            <span className="text-xs font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                              {fmt(item.value)} ₴
                            </span>
                          </div>
                        </div>
                        {/* progress bar — soft shadow effect */}
                        <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* ── END RIGHT SIDEBAR ── */}
        </div>
      </div>
    </div>
  );
}
