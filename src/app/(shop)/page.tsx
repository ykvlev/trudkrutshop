import Link from "next/link";
import type { CSSProperties } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { Icon } from "@/components/ui/icon";
import { currentSeed, seededShuffle } from "@/lib/format";
import { getAllProducts, getBestsellers, getNew, type Product } from "@/lib/data";

// Данные из БД на каждый запрос (каталог меняется с остатком).
export const dynamic = "force-dynamic";

const cols4 = { "--cols": 4 } as CSSProperties;

const features = [
  { icon: "LinearEssentionalUIDelivery", t: "Доставка по всей России", s: "SafeRoute: пункты выдачи и курьер" },
  { icon: "LinearEssentionalUICheckCircle", t: "Оплата картой и по счёту", s: "Для физлиц и организаций" },
  { icon: "LinearEssentionalUICrownStar", t: "Официальный мерч РСО", s: "Символика Российских Студенческих Отрядов" },
];

export default async function HomePage() {
  const [bestsellers, fresh, all] = await Promise.all([getBestsellers(4), getNew(4), getAllProducts()]);
  const shuffled = seededShuffle(all, currentSeed());

  return (
    <>
      {/* Главный экран: одно фото на весь экран, шапка накладывается поверх. */}
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element -- full-bleed фон-кадр */}
        <img className="hero-bg" src="/img/hero-rso.jpg" alt="" aria-hidden="true" />
        <div className="hero-in wrap">
          <h1 className="hero-title">#трудкрут,<br />а ты ещё круче</h1>
          <Link href="/catalog/futbolki" className="hero-cta">Смотреть каталог →</Link>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <div className="strip">
        {features.map((f) => (
          <div className="strip-i" key={f.t}>
            <Icon name={f.icon} size={30} style={{ color: "var(--rso-blue)", flexShrink: 0 }} />
            <div>
              <div className="strip-t">{f.t}</div>
              <div className="strip-s">{f.s}</div>
            </div>
          </div>
        ))}
      </div>

      <Section counter="01" title="Хиты продаж" href="/catalog/futbolki" items={bestsellers} />
      <Section counter="02" title="Новинки" href="/catalog/znachki" items={fresh} />

      <section className="band">
        <div>
          <p className="label label-w">Сообщество</p>
          <h2>Российские Студенческие Отряды</h2>
          <p>Официальный магазин отрядного мерча.</p>
        </div>
        <div style={{ justifySelf: "start" }}>
          <a href="https://vk.com" className="btn btn-white btn-l">РСО ВКонтакте →</a>
        </div>
      </section>

      <Section counter="03" title="Весь каталог" items={shuffled} />
      </div>
    </>
  );
}

function Section({
  eyebrow,
  counter,
  title,
  items,
  href,
}: {
  eyebrow?: string;
  counter?: string;
  title: string;
  items: Product[];
  href?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="sec-h">
        <div>
          {counter && <span className="sec-count">{counter} / 03</span>}
          {eyebrow && <p className="label">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        {href && <Link href={href} className="link">Все товары →</Link>}
      </div>
      <div className="pgrid" style={cols4}>
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
