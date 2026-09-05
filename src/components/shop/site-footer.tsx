import Link from "next/link";
import { IconTelegram, IconVk } from "./icons";
import { topCategories } from "@/lib/test-data";

const buyerLinks = [
  { href: "/delivery", label: "Доставка" },
  { href: "/payment", label: "Оплата" },
  { href: "/about", label: "О магазине" },
  { href: "/contacts", label: "Контакты" },
  { href: "/offer", label: "Публичная оферта" },
  { href: "/privacy", label: "Политика конфиденциальности" },
  { href: "/returns", label: "Возврат и обмен" },
];

export function SiteFooter() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-in">
          <div className="ftr-c">
            <span className="hdr-logo" style={{ color: "var(--rso-blue)" }}><span className="logo-mask lg" /></span>
            <p>Магазин отрядного мерча Российских Студенческих Отрядов. #ТрудКрут, а ты ещё круче!</p>
            <div className="ftr-soc">
              <a href="https://vk.com" aria-label="ВКонтакте"><IconVk /></a>
              <a href="https://t.me" aria-label="Telegram"><IconTelegram /></a>
            </div>
          </div>

          <div className="ftr-c">
            <span className="label">Каталог</span>
            {topCategories.map((c) => (
              <Link key={c.slug} href={`/catalog/${c.slug}`}>{c.name}</Link>
            ))}
          </div>

          <div className="ftr-c">
            <span className="label">Покупателям</span>
            {buyerLinks.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </div>

          <div className="ftr-c">
            <span className="label">Магазин</span>
            <span>Москва, Лефортовский пер., 8 стр. 1</span>
            <span>Пн–Пт 10:00–20:00, выходные по согласованию</span>
            <a href="mailto:rso.simv@mail.ru">rso.simv@mail.ru</a>
            <p className="ftr-req">
              АНО ДПО «РСО-РАЗВИТИЕ» · ИНН 7743351523 · КПП 770101001 · ОГРН 1207700490249 · 105066, г. Москва, ул. Доброслободская, д. 6 стр. 1
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
