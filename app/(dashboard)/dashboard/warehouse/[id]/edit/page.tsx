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
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
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
    <div className="max-w-2xl mx-auto px-6 pb-4">
      <FieldSet className="flex flex-col gap-3">
        <FieldGroup>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="street">Назва</FieldLabel>
              <Input
                name="name"
                placeholder="Назва"
                value={product.name}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="street">Артикул</FieldLabel>
              <Input
                name="article"
                placeholder="Артикул (SKU)"
                value={product.article}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="street">Опис</FieldLabel>
              <Input
                name="description"
                placeholder="Опис"
                value={product.description}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="street">Ціна</FieldLabel>
              <Input
                name="price"
                placeholder="Ціна"
                type="number"
                value={product.price}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="street">Кількість</FieldLabel>
              <Input
                name="stock"
                placeholder="Кількість"
                type="number"
                value={product.stock}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="street">Зображення</FieldLabel>
              <Input
                name="imageUrl"
                placeholder="URL зображення"
                value={product.imageUrl}
                onChange={handleChange}
              />
            </Field>

            {/* Категория */}
            <Field>
              <FieldLabel htmlFor="street">Оберіть категорію</FieldLabel>
              <Select
                value={product.categoryId}
                onValueChange={(v) => setProduct({ ...product, categoryId: v })}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((c) => (
                      <SelectItem
                        className="cursor-pointer"
                        key={c.id}
                        value={c.id}
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Статус */}
            <Field>
              <FieldLabel htmlFor="street">Оберіть Статус</FieldLabel>
              <Select
                value={product.isActive ? "true" : "false"}
                onValueChange={(v) =>
                  setProduct({ ...product, isActive: v === "true" })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="true">
                    Активний
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="false">
                    Неактивний
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeVariant(i)}
                    className="cursor-pointer"
                  >
                    <Trash className="text-red-500 shrink-0" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addVariant}
              className="mt-1 cursor-pointer"
            >
              <Plus />
              Додати варіант
            </Button>
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={() => router.push("/dashboard/warehouse")}
              disabled={saving}
            >
              Скасувати
            </Button>
            <Button
              className="flex-1 cursor-pointer"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving && <Spinner className="h-5 w-5" />}
              {saving ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        </FieldGroup>
      </FieldSet>
    </div>
  );
}
