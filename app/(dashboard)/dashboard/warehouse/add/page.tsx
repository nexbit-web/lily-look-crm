"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Trash, ArrowLeft, RefreshCcw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ProductVariantForm = {
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
  variants: ProductVariantForm[];
};

const emptyProduct: ProductForm = {
  name: "",
  article: "",
  description: "",
  price: "",
  stock: "",
  imageUrl: "",
  isActive: true,
  categoryId: "",
  variants: [],
};

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductForm>(emptyProduct);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) {
          setProduct((p) => ({ ...p, categoryId: data[0].id }));
        }
      })
      .catch(() => toast.error("Не вдалося завантажити категорії"));
  }, []);

  useEffect(() => {
    const filled =
      product.name &&
      product.article &&
      product.price &&
      product.stock &&
      product.categoryId &&
      product.variants.every((v) => v.size && v.color && v.stock);
    setIsValid(!!filled);
  }, [product]);

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
    key: keyof ProductVariantForm,
    value: string,
  ) => {
    const updated = [...product.variants];
    updated[index][key] = value;
    setProduct({ ...product, variants: updated });
  };

  const removeVariant = (index: number) => {
    const updated = [...product.variants];
    updated.splice(index, 1);
    setProduct({ ...product, variants: updated });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
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
          size: v.size,
          color: v.color,
          stock: parseInt(v.stock),
        })),
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Не вдалося додати продукт");
      }

      toast.success("Продукт додано!");
      router.push("/dashboard/warehouse");
    } catch (error: any) {
      toast.error(error.message || "Не вдалося додати продукт");
    } finally {
      setIsSubmitting(false);
    }
  };
  // генерація Артикул (SKU)
  const generateSKU = () => {
    const randomNumber = Math.floor(100000 + Math.random() * 900000).toString();

    setProduct((prev) => ({
      ...prev,
      article: randomNumber,
    }));
  };

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
              <FieldLabel htmlFor="zip">Артикул</FieldLabel>
              <div className="flex gap-2">
                <Input
                  name="article"
                  placeholder="Артикул (SKU)"
                  value={product.article}
                  onChange={handleChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSKU}
                  className="shrink-0 cursor-pointer"
                >
                  <RefreshCcw />
                </Button>
              </div>
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
            <Field>
              <FieldLabel htmlFor="street">Оберіть категорію</FieldLabel>
              {/* Категория */}
              <Select
                value={product.categoryId}
                onValueChange={(v) => setProduct({ ...product, categoryId: v })}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent >
                  <SelectGroup>
                    {categories.map((c) => (
                      <SelectItem className="cursor-pointer" key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="street">Оберіть Статус</FieldLabel>
              {/* Статус */}
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
            <p className="text-sm font-medium mb-1">
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
                    placeholder="Кількість"
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
              className="mt-2 cursor-pointer"
            >
              <Plus />
              Додати варіант
            </Button>
          </div>
          {/* Кнопки */}
          <div className="flex gap-2 ">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={() => router.push("/dashboard/warehouse")}
              disabled={isSubmitting}
            >
              Скасувати
            </Button>
            <Button
              className="flex-1 cursor-pointer"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting && <Spinner className="h-5 w-5" />}
              {isSubmitting ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        </FieldGroup>
      </FieldSet>
    </div>
  );
}
