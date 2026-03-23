import type { Discount } from "@/store/discounts-store";

export type PriceInfo = {
  finalPrice:    number;
  originalPrice: number;
  discount:      Discount | null;
  discountLabel: string | null; // "-20%" или "-100₴"
};

export function calcPrice(
  product: { id: string; categoryId: string; price: number },
  discounts: Discount[]
): PriceInfo {
  const now    = new Date();
  const active = discounts.filter(d => {
    if (!d.isActive) return false;
    if (new Date(d.endsAt) < now) return false;
    if (new Date(d.startsAt) > now) return false;
    if (d.target === "PRODUCT")  return d.productId  === product.id;
    if (d.target === "CATEGORY") return d.categoryId === product.categoryId;
    return d.target === "ALL";
  });

  if (active.length === 0) {
    return { finalPrice: product.price, originalPrice: product.price, discount: null, discountLabel: null };
  }

  // Берём скидку которая даёт наибольшую выгоду
  const best = active.reduce((prev, curr) => {
    const prevSave = prev.type === "PERCENTAGE"
      ? product.price * prev.value / 100
      : prev.value;
    const currSave = curr.type === "PERCENTAGE"
      ? product.price * curr.value / 100
      : curr.value;
    return currSave > prevSave ? curr : prev;
  });

  const finalPrice = best.type === "PERCENTAGE"
    ? Math.max(0, product.price * (1 - best.value / 100))
    : Math.max(0, product.price - best.value);

  const discountLabel = best.type === "PERCENTAGE"
    ? `-${best.value}%`
    : `-${best.value}₴`;

  return { finalPrice, originalPrice: product.price, discount: best, discountLabel };
}