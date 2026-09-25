"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { ProductThumb } from "./product-thumb";
import { IconClose } from "./icons";
import { formatPrice } from "@/lib/format";

type DrawerCtx = { isOpen: boolean; open: () => void; close: () => void };
const Ctx = createContext<DrawerCtx | null>(null);

export function useCartDrawer(): DrawerCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCartDrawer должен вызываться внутри <CartDrawerProvider>");
  return c;
}

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const value: DrawerCtx = { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
  return (
    <Ctx.Provider value={value}>
      {children}
      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </Ctx.Provider>
  );
}

function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const cart = useCart();
  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="mask mask-right" onClick={onClose}>
      <aside className="cdrawer" role="dialog" aria-modal="true" aria-label="Корзина" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-h">
          <span className="drawer-title">Корзина{cart.count > 0 ? ` · ${cart.count}` : ""}</span>
          <button type="button" className="ibtn" aria-label="Закрыть корзину" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="cdrawer-empty">
            <p>Корзина пуста</p>
            <Link href="/catalog/odezda" className="btn btn-blue btn-m" onClick={onClose}>В каталог</Link>
          </div>
        ) : (
          <>
            <div className="cdrawer-items">
              {cart.items.map((i) => (
                <div className="cdrawer-i" key={i.variantId}>
                  <div className="cdrawer-img"><ProductThumb label={i.name} category={i.category} /></div>
                  <div className="cdrawer-b">
                    <Link href={`/product/${i.slug}`} className="cdrawer-n" onClick={onClose}>{i.name}</Link>
                    {i.variantLabel && <div className="cdrawer-v">{i.variantLabel}</div>}
                    <div className="cdrawer-f">
                      <div className="qty qty-sm">
                        <button type="button" onClick={() => cart.setQty(i.variantId, i.qty - 1)} aria-label="Меньше">−</button>
                        <span className="num">{i.qty}</span>
                        <button type="button" onClick={() => cart.setQty(i.variantId, i.qty + 1)} aria-label="Больше">+</button>
                      </div>
                      <span className="num cdrawer-p">{formatPrice(i.price * i.qty)}</span>
                    </div>
                  </div>
                  <button type="button" className="cdrawer-x" aria-label="Удалить" onClick={() => cart.remove(i.variantId)}>
                    <IconClose width={16} height={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="cdrawer-foot">
              <div className="cdrawer-total"><span>Итого</span><span className="num">{formatPrice(total)}</span></div>
              <Link href="/cart" className="btn btn-blue btn-l" onClick={onClose} style={{ width: "100%" }}>Оформить заказ</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
