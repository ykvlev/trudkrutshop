"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// Каркасная корзина. Хранит позиции по id товара с количеством.
// Настоящая корзина (снимок цены, вариант, остаток, cookie-токен, сервер)
// придёт на этапе оплаты — здесь достаточно для демо витрины и чекаута.

export type CartItem = { productId: string; qty: number };

type CartContextValue = {
  items: CartItem[];
  count: number; // суммарное количество
  has: (id: string) => boolean;
  toggle: (id: string) => void; // добавить 1 / убрать
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    has: (id) => items.some((i) => i.productId === id),
    toggle: (id) =>
      setItems((prev) =>
        prev.some((i) => i.productId === id)
          ? prev.filter((i) => i.productId !== id)
          : [...prev, { productId: id, qty: 1 }],
      ),
    setQty: (id, qty) =>
      setItems((prev) =>
        prev.map((i) => (i.productId === id ? { ...i, qty: Math.max(1, qty) } : i)),
      ),
    remove: (id) => setItems((prev) => prev.filter((i) => i.productId !== id)),
    clear: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart должен вызываться внутри <CartProvider>");
  return ctx;
}
