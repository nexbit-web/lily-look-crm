"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Plus, Trash, ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type VariantForm = {
  id?: string;
  size: string;
  color: string;
  stock: string;
};

type ProductForm = {
  name: string;
  article: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
  categoryId: string;
  variants: VariantForm[];
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductForm>({
    name: "",
    article: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    isActive: true,
    categoryId: "",
    variants: [],
  });
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

  // Загружаем продукт и категории
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch("/api/categories"),
        ]);

        const productData = await productRes.json();
        const categoriesData = await categoriesRes.json();

        setCategories(categoriesData);
        setProduct({
          name: productData.name ?? "",
          article: productData.sku ?? "",
          description: productData.description ?? "",
          price: String(productData.price ?? ""),
          stock: String(productData.stock ?? ""),
          imageUrl: productData.imageUrl ?? "",
          isActive: productData.isActive ?? true,
          categoryId: productData.categoryId ?? "",
          variants:
            productData.variants?.map((v: any) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              stock: String(v.stock),
            })) ?? [],
        });
      } catch (err) {
        toast.error("Не вдалося завантажити продукт");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const addVariant = () => {
    setProduct({
      ...product,
      variants: [...product.variants, { size: "", color: "", stock: "" }],
    });
  };

  const updateVariant = (
    index: number,
    key: keyof VariantForm,
    value: string,
  ) => {
    const updated = [...product.variants];
    updated[index] = { ...updated[index], [key]: value };
    setProduct({ ...product, variants: updated });
  };

  const removeVariant = (index: number) => {
    const variant = product.variants[index];

    // Если вариант из БД — запоминаем его id для удаления при сохранении
    if (variant.id) {
      setDeletedVariantIds((prev) => [...prev, variant.id!]);
    }

    const updated = [...product.variants];
    updated.splice(index, 1);
    setProduct({ ...product, variants: updated });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Удаляем варианты которые убрали из формы
      await Promise.all(
        deletedVariantIds.map((variantId) =>
          fetch(`/api/products/${id}/variants/${variantId}`, {
            method: "DELETE",
          }),
        ),
      );

      const payload = {
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        sku: product.article,
        stock: parseInt(product.stock),
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        categoryId: product.categoryId,
        variants: product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          stock: parseInt(v.stock),
        })),
      };

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Помилка");
      }

      toast.success("Продукт збережено!");
      router.push("/dashboard/warehouse");
    } catch (error: any) {
      toast.error(error.message || "Не вдалося зберегти продукт");
    } finally {
      setSaving(false);
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
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard/warehouse")}
          className="text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Редагувати продукт</h1>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          name="name"
          placeholder="Назва"
          value={product.name}
          onChange={handleChange}
        />
        <Input
          name="article"
          placeholder="Артикул (SKU)"
          value={product.article}
          onChange={handleChange}
        />
        <Input
          name="description"
          placeholder="Опис"
          value={product.description}
          onChange={handleChange}
        />
        <Input
          name="price"
          placeholder="Ціна"
          type="number"
          value={product.price}
          onChange={handleChange}
        />
        <Input
          name="stock"
          placeholder="Кількість"
          type="number"
          value={product.stock}
          onChange={handleChange}
        />
        <Input
          name="imageUrl"
          placeholder="URL зображення"
          value={product.imageUrl}
          onChange={handleChange}
        />

        {/* Категория */}
        <Select
          value={product.categoryId}
          onValueChange={(v) => setProduct({ ...product, categoryId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Оберіть категорію" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Статус */}
        <Select
          value={product.isActive ? "true" : "false"}
          onValueChange={(v) =>
            setProduct({ ...product, isActive: v === "true" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Активний</SelectItem>
            <SelectItem value="false">Неактивний</SelectItem>
          </SelectContent>
        </Select>

        {/* Варианты */}
        <div>
          <p className="text-sm font-medium mb-2">
            Варіанти (Розмір / Колір / Кількість)
          </p>
          <div className="flex flex-col gap-2">
            {product.variants.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Розмір"
                  value={v.size}
                  onChange={(e) => updateVariant(i, "size", e.target.value)}
                />
                <Input
                  placeholder="Колір"
                  value={v.color}
                  onChange={(e) => updateVariant(i, "color", e.target.value)}
                />
                <Input
                  placeholder="К-сть"
                  type="number"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, "stock", e.target.value)}
                />
                <Trash
                  size={18}
                  onClick={() => removeVariant(i)}
                  className="cursor-pointer text-red-500 shrink-0"
                />
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addVariant}
            className="mt-2"
          >
            <Plus className="mr-1 h-4 w-4" />
            Додати варіант
          </Button>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/dashboard/warehouse")}
            disabled={saving}
          >
            Скасувати
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
            {saving ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </div>
    </div>
  );
}
