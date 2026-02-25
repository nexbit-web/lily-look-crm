"use client";

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Plus, Trash, Tag, CheckCircle2, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string; slug: string };

// ─── Transliteration ──────────────────────────────────────────────────────────

const UA_MAP: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"h",д:"d",е:"e",є:"ye",ж:"zh",з:"z",
  и:"y",і:"i",ї:"yi",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",
  п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",
  ш:"sh",щ:"shch",ь:"",ю:"yu",я:"ya",ґ:"g",ё:"yo",
};

const toSlug = (val: string) =>
  val.toLowerCase().trim()
    .replace(/[а-яёїієґ]/g, (c) => UA_MAP[c] ?? c)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName]             = useState("");
  const [slug, setSlug]             = useState("");
  const [adding, setAdding]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data: Category[] = await res.json();
      setCategories(data);
    } catch {
      toast.error("Не вдалося завантажити категорії");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(toSlug(val));
  };

  const handleAdd = async () => {
    if (!name.trim() || !slug.trim()) { toast.error("Заповніть усі поля"); return; }
    if (adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success("Категорію додано!");
      setName(""); setSlug("");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Помилка");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити категорію? Це може вплинути на продукти.")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Категорію видалено");
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Помилка видалення");
    } finally {
      setDeletingId(null);
    }
  };

  const formDone = !!(name.trim() && slug.trim());

  if (loading)
    return <div className="flex min-h-[80vh] items-center justify-center"><Spinner className="h-6 w-6" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Шапка ── */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Категорії</h1>
          <p className="text-xs text-gray-400 mt-0.5">Управління категоріями товарів</p>
        </div>

        {/* ── Форма додавання ── */}
        <div className={`bg-white dark:bg-zinc-900 rounded-3xl border transition-colors ${
          formDone ? "border-green-100 dark:border-green-900" : "border-gray-100 dark:border-zinc-800"
        }`}>
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-50 dark:border-zinc-800">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
              formDone ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-400"
            }`}>
              {formDone ? <CheckCircle2 size={14} /> : <Plus size={13} />}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-zinc-200">
              <Tag size={16} />
              Нова категорія
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Назва *">
                <Input
                  placeholder="Наприклад: Куртки"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </Field>
              <Field label="Slug *">
                <Input
                  placeholder="kurtky"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="rounded-xl font-mono"
                />
              </Field>
            </div>
            <p className="text-xs text-gray-400 -mt-1">
              Slug генерується автоматично — можна змінити вручну
            </p>
            <Button
              onClick={handleAdd}
              disabled={adding || !formDone}
              className="rounded-2xl h-10 font-medium w-full sm:w-auto cursor-pointer"
            >
              {adding ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Додавання...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus size={15} />
                  Додати категорію
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* ── Список категорій ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
              <LayoutGrid size={13} />
              Категорії · {categories.length}
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-300 dark:text-zinc-600">
              <Tag size={32} strokeWidth={1.5} />
              <p className="text-sm">Категорій поки немає</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{c.slug}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {deletingId === c.id
                      ? <Spinner className="h-3.5 w-3.5" />
                      : <Trash size={14} />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}