"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Trash } from "lucide-react";
import { checkRole } from "@/lib/checkRole";
import { Spinner } from "@/components/ui/spinner";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Автогенерация slug из названия
  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[а-яёїієґ]/g, (char) => {
          const map: Record<string, string> = {
            а: "a",
            б: "b",
            в: "v",
            г: "h",
            д: "d",
            е: "e",
            є: "ye",
            ж: "zh",
            з: "z",
            и: "y",
            і: "i",
            ї: "yi",
            й: "y",
            к: "k",
            л: "l",
            м: "m",
            н: "n",
            о: "o",
            п: "p",
            р: "r",
            с: "s",
            т: "t",
            у: "u",
            ф: "f",
            х: "kh",
            ц: "ts",
            ч: "ch",
            ш: "sh",
            щ: "shch",
            ь: "",
            ю: "yu",
            я: "ya",
            ґ: "g",
            ё: "yo",
          };
          return map[char] || char;
        }),
    );
  };

  const handleAdd = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Заповніть усі поля");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Категорію додано!");
      setName("");
      setSlug("");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Помилка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити категорію? Це може вплинути на продукти.")) return;
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Категорію видалено");
      fetchCategories();
    } catch {
      toast.error("Помилка видалення");
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Управління категоріями</h1>

      {/* Форма добавления */}
      <div className="flex flex-col gap-3 mb-8 p-4 border rounded-lg">
        <h2 className="font-semibold text-lg">Нова категорія</h2>
        <Input
          placeholder="Назва (напр. Куртка)"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
        <Input
          placeholder="Slug (напр. kurtka)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <Button onClick={handleAdd} disabled={isLoading}>
          {isLoading ? "Додавання..." : "Додати категорію"}
        </Button>
      </div>

      {/* Список категорий */}
      <div className="flex flex-col gap-2">
        {categories.length === 0 && (
          <p className="text-gray-400 text-sm">Категорій поки немає</p>
        )}
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-gray-400">{c.slug}</p>
            </div>
            <Trash
              size={18}
              className="cursor-pointer text-red-500 hover:text-red-700"
              onClick={() => handleDelete(c.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
