import { create } from "zustand";

export type DiscountType   = "PERCENTAGE" | "FIXED";
export type DiscountTarget = "ALL" | "CATEGORY" | "PRODUCT";

export type Discount = {
  id:         string;
  name:       string;
  type:       DiscountType;
  value:      number;
  target:     DiscountTarget;
  categoryId: string | null;
  productId:  string | null;
  startsAt:   string;
  endsAt:     string;
  isActive:   boolean;
};

type DiscountsStore = {
  discounts:   Discount[];
  loaded:      boolean;
  fetch:       () => Promise<void>;
  add:         (d: Discount) => void;
  remove:      (id: string) => void;
  deactivate:  (id: string) => void;
};

export const useDiscountsStore = create<DiscountsStore>((set, get) => ({
  discounts: [],
  loaded:    false,

  fetch: async () => {
    if (get().loaded) return;
    const res  = await fetch("/api/discounts");
    const data = await res.json();
    set({ discounts: data, loaded: true });
  },

  add:        (d)  => set(s => ({ discounts: [d, ...s.discounts] })),
  remove:     (id) => set(s => ({ discounts: s.discounts.filter(d => d.id !== id) })),
  deactivate: (id) => set(s => ({
    discounts: s.discounts.map(d => d.id === id ? { ...d, isActive: false } : d),
  })),
}));