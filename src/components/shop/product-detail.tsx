"use client";

import { useMemo, useState } from "react";
import { useCart } from "./cart-provider";
import { ProductThumb } from "./product-thumb";
import { IconCheck, IconClose, IconPlus } from "./icons";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/test-data";

const distinct = (xs: (string | undefined)[]): string[] =>
  [...new Set(xs.filter((x): x is string => !!x))];

export function ProductDetail({ product }: { product: Product }) {
  const cart = useCart();
  const added = cart.has(product.id);

  const sizes = useMemo(() => distinct(product.variants.map((v) => v.size)), [product]);
  const colors = useMemo(() => distinct(product.variants.map((v) => v.color)), [product]);
  const prints = useMemo(() => distinct(product.variants.map((v) => v.print)), [product]);

  const [size, setSize] = useState<string | undefined>(sizes.length === 1 ? sizes[0] : undefined);
  const [color, setColor] = useState<string | undefined>(colors.length === 1 ? colors[0] : undefined);
  const [print, setPrint] = useState<string | undefined>(prints.length === 1 ? prints[0] : undefined);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [chart, setChart] = useState(false);

  const selected = product.variants.find(
    (v) =>
      (sizes.length === 0 || v.size === size) &&
      (colors.length === 0 || v.color === color) &&
      (prints.length === 0 || v.print === print),
  );
  const needsChoice =
    (sizes.length > 0 && !size) || (colors.length > 0 && !color) || (prints.length > 0 && !print);
  const stock = selected?.stock ?? 0;
  const canBuy = !needsChoice && stock > 0;

  return (
    <div className="pdp">
      {/* Галерея */}
      <div>
        <ProductThumb label={product.name} className={undefined} />
        <div className="pdp-thumbs">
          {[0, 1, 2, 3].map((n) => (
            <button key={n} type="button" className={n === img ? "is-on" : ""} onClick={() => setImg(n)} aria-label={`Ракурс ${n + 1}`}>
              <ProductThumb label={`${n + 1}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Информация */}
      <div className="pdp-i">
        <div className="chips" style={{ marginBottom: 12 }}>
          {product.isNew && <span className="badge badge-blue">Новинка</span>}
          {product.isBestseller && <span className="badge badge-dark">Хит</span>}
        </div>

        <h1>{product.name}</h1>
        <div className="pdp-sku">Артикул: {product.variants[0]?.sku ?? product.slug}</div>

        <div className="pdp-buy">
          <div className="pdp-p">
            <span className="price price-xl">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="price-old">{formatPrice(product.oldPrice)}</span>}
          </div>
        </div>

        {sizes.length > 0 && (
          <div className="pdp-row">
            <div className="pdp-row-h">
              <span className="fld-l" style={{ margin: 0 }}>Размер</span>
              <button type="button" className="link" onClick={() => setChart(true)}>Таблица размеров</button>
            </div>
            <div className="chips" style={{ marginTop: 12 }}>
              {sizes.map((s) => (
                <button key={s} type="button" className={`chip${s === size ? " is-on" : ""}`} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div className="pdp-row">
            <span className="fld-l" style={{ margin: 0 }}>Цвет</span>
            <div className="chips" style={{ marginTop: 12 }}>
              {colors.map((c) => (
                <button key={c} type="button" className={`chip${c === color ? " is-on" : ""}`} onClick={() => setColor(c)}>{c}</button>
              ))}
            </div>
          </div>
        )}

        {prints.length > 0 && (
          <div className="pdp-row">
            <span className="fld-l" style={{ margin: 0 }}>Принт</span>
            <div className="chips" style={{ marginTop: 12 }}>
              {prints.map((pr) => (
                <button key={pr} type="button" className={`chip${pr === print ? " is-on" : ""}`} onClick={() => setPrint(pr)}>{pr}</button>
              ))}
            </div>
          </div>
        )}

        <div className={`pdp-stock${!needsChoice && stock === 0 ? " is-out" : ""}`}>
          {needsChoice ? "Выберите параметры, чтобы увидеть наличие"
            : stock > 0 ? `В наличии: ${stock} шт.` : "Нет в наличии"}
        </div>

        <div className="pdp-buy" style={{ border: 0, paddingTop: 0 }}>
          <div className="qty">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Меньше">−</button>
            <span className="num">{qty}</span>
            <button type="button" disabled={!canBuy || qty >= stock} onClick={() => setQty((q) => Math.min(stock || 1, q + 1))} aria-label="Больше">+</button>
          </div>
          <button
            type="button"
            className={`btn btn-l ${added ? "btn-outline" : "btn-blue"}`}
            style={{ flex: 1, minWidth: 200 }}
            disabled={!canBuy && !added}
            onClick={() => cart.toggle(product.id)}
          >
            {added ? <IconCheck width={18} height={18} /> : <IconPlus width={18} height={18} />}
            {added ? "В корзине" : "В корзину"}
          </button>
        </div>

        {product.description && <p className="pdp-d" style={{ marginTop: 20 }}>{product.description}</p>}

        <div className="pdp-note" style={{ marginTop: 20 }}>
          Доставка по всей России через SafeRoute · оплата картой или по счёту для юрлиц
        </div>
      </div>

      {chart && <SizeChartModal sizes={sizes} onClose={() => setChart(false)} />}
    </div>
  );
}

function SizeChartModal({ sizes, onClose }: { sizes: string[]; onClose: () => void }) {
  const rows = sizes.map((s, i) => ({ size: s, chest: 88 + i * 6, length: 66 + i * 2 }));
  return (
    <div className="mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h3>Таблица размеров</h3>
          <button type="button" className="ibtn" aria-label="Закрыть" onClick={onClose}><IconClose /></button>
        </div>
        <table className="chart">
          <thead>
            <tr><th>Размер</th><th>Обхват груди, см</th><th>Длина, см</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size}><td>{r.size}</td><td>{r.chest}–{r.chest + 4}</td><td>{r.length}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="modal-note">Демо-данные. Реальные сетки — по каждому изделию от заказчика.</p>
      </div>
    </div>
  );
}
