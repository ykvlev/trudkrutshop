"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Product, Variant } from "@/lib/test-data";

const STORAGE_KEY = "tksh-cart";

// Корзина на уровне ВАРИАНТА (размер × цвет × принт) со снимком данных позиции.
// Снимок делает корзину самодостаточной: клиент не ходит в БД за названием/ценой,
// а заказу нужен именно variantId (для брони остатка и снимка цены на сервере).

export type CartLineItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  oldPrice?: number;
  category: string;
  variantLabel?: string; // «M · Серый»
  qty: number;
};

export type CartSnapshot = Omit<CartLineItem, "qty">;

/** Первый доступный (в наличии) вариант товара, иначе первый. */
export function pickVariant(p: Product): Variant | undefined {
  return p.variants.find((v) => v.stock > 0) ?? p.variants[0];
}

const variantLabel = (v: Variant): string | undefined =>
  [v.size, v.color, v.print].filter(Boolean).join(" · ") || undefined;

/** Снимок позиции из товара и выбранного варианта. */
export function toSnapshot(p: Product, v: Variant): CartSnapshot {
  return {
    variantId: v.id ?? v.sku,
    productId: p.id,
    slug: p.slug,
    name: p.name,
    sku: v.sku,
    price: p.price,
    oldPrice: p.oldPrice,
    category: p.category,
    variantLabel: variantLabel(v),
  };
}

type CartContextValue = {
  items: CartLineItem[];
  count: number;
  has: (variantId: string) => boolean;
  add: (snap: CartSnapshot, qty?: number) => void;
  toggle: (snap: CartSnapshot) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const mounted = useRef(false); // чтобы не затереть хранилище пустышкой на маунте

  // Восстановление корзины из localStorage после гидратации. Именно в effect
  // (не в инициализаторе useState): сервер рендерит пустую корзину, чтение из
  // localStorage на клиенте после маунта не ломает гидратацию.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- восстановление после маунта, безопасно для гидратации
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // Приватный режим / выключенное хранилище — работаем без персиста.
    }
  }, []);

  // Сохранение при изменениях. Первый (монтажный) вызов пропускаем, иначе
  // пустой initial-state затрёт корзину в хранилище до её восстановления.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* игнорируем недоступность хранилища */
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    has: (variantId) => items.some((i) => i.variantId === variantId),
    add: (snap, qty = 1) =>
      setItems((prev) => {
        const found = prev.find((i) => i.variantId === snap.variantId);
        return found
          ? prev.map((i) => (i.variantId === snap.variantId ? { ...i, qty: i.qty + qty } : i))
          : [...prev, { ...snap, qty }];
      }),
    toggle: (snap) =>
      setItems((prev) =>
        prev.some((i) => i.variantId === snap.variantId)
          ? prev.filter((i) => i.variantId !== snap.variantId)
          : [...prev, { ...snap, qty: 1 }],
      ),
    setQty: (variantId, qty) =>
      setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, qty: Math.max(1, qty) } : i))),
    remove: (variantId) => setItems((prev) => prev.filter((i) => i.variantId !== variantId)),
    clear: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart должен вызываться внутри <CartProvider>");
  return ctx;
}
