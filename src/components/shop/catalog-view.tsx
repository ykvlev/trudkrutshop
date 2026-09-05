"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { type Product } from "@/lib/test-data";

type Sort = "new" | "price-asc" | "price-desc" | "size";
const PAGE = 9;

const sortLabels: Record<Sort, string> = {
  new: "Сначала новинки",
  "price-asc": "Дешевле",
  "price-desc": "Дороже",
  size: "По размеру",
};

export function CatalogView({ items }: { items: Product[] }) {
  const sizes = useMemo(() => [...new Set(items.flatMap((p) => p.sizes ?? []))], [items]);
  const [minP, maxP] = useMemo(() => {
    const ps = items.map((p) => p.price);
    return [Math.min(...ps), Math.max(...ps)];
  }, [items]);

  const [sort, setSort] = useState<Sort>("new");
  const [activeSizes, setActiveSizes] = useState<Set<string>>(new Set());
  const [priceFrom, setPriceFrom] = useState<number | "">("");
  const [priceTo, setPriceTo] = useState<number | "">("");
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    const r = items.filter((p) => {
      if (activeSizes.size && !(p.sizes ?? []).some((s) => activeSizes.has(s))) return false;
      if (priceFrom !== "" && p.price < priceFrom) return false;
      if (priceTo !== "" && p.price > priceTo) return false;
      return true;
    });
    return [...r].sort((a, b) => {
      switch (sort) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "size": return (a.sizes?.length ?? 0) - (b.sizes?.length ?? 0);
        default: return Number(b.isNew ?? false) - Number(a.isNew ?? false);
      }
    });
  }, [items, activeSizes, priceFrom, priceTo, sort]);

  const shown = filtered.slice(0, visible);
  const canMore = visible < filtered.length;

  const toggleSize = (s: string) =>
    setActiveSizes((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s); else n.add(s);
      return n;
    });
  const reset = () => { setActiveSizes(new Set()); setPriceFrom(""); setPriceTo(""); };

  return (
    <div className="shell">
      <aside className="left">
        <div className="filters">
          {sizes.length > 0 && (
            <div className="fld">
              <span className="fld-l">Размер</span>
              <div className="chips">
                {sizes.map((s) => (
                  <button key={s} type="button" className={`chip${activeSizes.has(s) ? " is-on" : ""}`} onClick={() => toggleSize(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="fld">
            <span className="fld-l">Цена, ₽</span>
            <div className="range">
              <input type="number" inputMode="numeric" placeholder={String(minP)} aria-label="Цена от"
                value={priceFrom} onChange={(e) => setPriceFrom(e.target.value === "" ? "" : Number(e.target.value))} />
              <span>—</span>
              <input type="number" inputMode="numeric" placeholder={String(maxP)} aria-label="Цена до"
                value={priceTo} onChange={(e) => setPriceTo(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>
          <button type="button" className="link" onClick={reset}>Сбросить фильтры</button>
        </div>

        <a href="https://vk.com" className="mini mini-b">
          <div className="mini-t">РСО ВКонтакте</div>
          <div className="mini-s">Новости и акции движения</div>
        </a>
        <a href="https://xn--e1ainkj.xn--p1ai" className="mini">
          <div className="mini-t">Сайт РСО</div>
          <div className="mini-s">О Российских Студенческих Отрядах</div>
        </a>
      </aside>

      <div className="page">
        <div className="toolbar">
          <span className="toolbar-c">{filtered.length} {plural(filtered.length, "товар", "товара", "товаров")}</span>
          <div className="toolbar-r">
            <label className="sortsel">
              <span>Сортировка</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                {(Object.keys(sortLabels) as Sort[]).map((s) => (
                  <option key={s} value={s}>{sortLabels[s]}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {shown.length > 0 ? (
          <div className="pgrid">
            {shown.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="filters" style={{ textAlign: "center", padding: 48 }}>
            <p style={{ color: "var(--rso-text-muted)" }}>По выбранным фильтрам ничего не найдено.</p>
            <button type="button" className="btn btn-outline btn-m" onClick={reset}>Сбросить фильтры</button>
          </div>
        )}

        {canMore && (
          <div className="more">
            <button type="button" className="btn btn-outline btn-l" onClick={() => setVisible((v) => v + PAGE)}>
              Показать ещё
            </button>
            <Link href="?page=2" className="hint">Показано {shown.length} из {filtered.length}</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
