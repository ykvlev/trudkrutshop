import Link from "next/link";
import type { CSSProperties } from "react";
import { HeroSlider } from "@/components/shop/hero-slider";
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
    <div className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <HeroSlider />

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

      <Section title="Хиты продаж" href="/catalog/futbolki" items={bestsellers} />
      <Section title="Новинки" href="/catalog/znachki" items={fresh} />

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

      <Section title="Весь каталог" items={shuffled} />
    </div>
  );
}

function Section({
  eyebrow,
  title,
  items,
  href,
}: {
  eyebrow?: string;
  title: string;
  items: Product[];
  href?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="sec-h">
        <div>
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
