"use client";

import Link from "next/link";
import { useRef } from "react";
import { useCart, pickVariant, toSnapshot } from "./cart-provider";
import { ProductThumb } from "./product-thumb";
import { flyToCart } from "./fly-to-cart";
import { IconCart, IconCheck, IconPlus } from "./icons";
import { formatPrice } from "@/lib/format";
import { type Product } from "@/lib/test-data";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const imgRef = useRef<HTMLAnchorElement>(null);
  const variant = pickVariant(product);
  const available = !!variant && variant.stock > 0;
  const snap = variant ? toSnapshot(product, variant) : null;
  const added = snap ? cart.has(snap.variantId) : false;

  const onToggle = () => {
    if (!snap) return;
    const wasIn = cart.has(snap.variantId);
    cart.toggle(snap);
    if (!wasIn) {
      const box = imgRef.current;
      const src = box?.querySelector("img")?.src;
      flyToCart(box, src);
    }
  };
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : null;

  return (
    <article className="pcard">
      <Link ref={imgRef} href={`/product/${product.slug}`} className="pcard-img" aria-label={product.name}>
        <div className="pcard-badges">
          {product.isNew && <span className="badge badge-blue">Новинка</span>}
          {product.isBestseller && <span className="badge badge-dark">Хит</span>}
          {discount !== null && <span className="badge badge-alert">−{discount}%</span>}
        </div>
        <ProductThumb label={product.name} category={product.category} />
      </Link>

      <div className="pcard-b">
        <Link href={`/product/${product.slug}`} className="pcard-n">{product.name}</Link>
        <div className="pcard-f">
          <div className="pcard-p">
            <span className="price">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="price-old">{formatPrice(product.oldPrice)}</span>}
          </div>

          {available && snap ? (
            <span className="cart-toggle">
              <button
                type="button"
                onClick={onToggle}
                aria-pressed={added}
                aria-label={added ? "Товар добавлен в корзину" : "Добавить товар в корзину"}
                className={`ibtn ibtn-cart${added ? " is-in" : ""}`}
              >
                {added ? <IconCheck width={20} height={20} /> : <IconPlus width={20} height={20} />}
              </button>
              <span className="tip">{added ? "Товар добавлен в корзину" : "Добавить товар в корзину"}</span>
            </span>
          ) : (
            <a href="#notify" className="ibtn" aria-label="Сообщить о наличии" title="Сообщить о наличии">
              <IconCart width={20} height={20} />
            </a>
          )}
        </div>
        {!available && <span className="pcard-s">Нет в наличии</span>}
      </div>
    </article>
  );
}
