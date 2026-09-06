import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Статус заказа",
  robots: { index: false, follow: false },
};

const STATUS: Record<string, { label: string; cls: string }> = {
  NEW_PHYSICAL: { label: "Новый", cls: "badge-mute" },
  AWAITING_PAYMENT: { label: "Ожидает оплаты", cls: "badge-warn" },
  PAID_PHYSICAL: { label: "Оплачен", cls: "badge-ok" },
  NEW_LEGAL: { label: "Ожидает оплаты по счёту", cls: "badge-mute" },
  PAID_LEGAL: { label: "Оплачен", cls: "badge-ok" },
  SHIPPED: { label: "Отправлен", cls: "badge-blue" },
  COMPLETED: { label: "Выполнен", cls: "badge-ok" },
  CANCELLED: { label: "Отменён", cls: "badge-alert" },
  ARCHIVED: { label: "В архиве", cls: "badge-mute" },
};

export default async function OrderPage(props: PageProps<"/order/[number]">) {
  const { number } = await props.params;
  const order = await prisma.order.findUnique({ where: { number }, include: { items: true } });
  if (!order) notFound();

  const st = STATUS[order.status] ?? { label: order.status, cls: "badge-mute" };

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <nav aria-label="Хлебные крошки" className="crumbs">
        <Link href="/">Главная</Link>
        <span className="crumbs-s">/</span>
        <span>Заказ {order.number}</span>
      </nav>

      <div className="okhead">
        <div>
          <p className="label">Заказ</p>
          <h1 style={{ marginBottom: 8 }}>{order.number}</h1>
          <p>
            <span className={`badge ${st.cls}`}>{st.label}</span>{" "}
            <span className="hint" style={{ marginLeft: 8 }}>
              от {new Date(order.createdAt).toLocaleString("ru-RU")}
            </span>
          </p>
        </div>
      </div>

      <div className="doc" style={{ marginTop: 24 }}>
        <table className="ctable is-flat">
          <thead>
            <tr><th>Товар</th><th>Кол-во</th><th>Сумма</th></tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>{i.nameSnapshot} <span className="hint">({i.skuSnapshot})</span></td>
                <td className="num">{i.quantity}</td>
                <td className="num">{formatPrice(Number(i.priceSnapshot) * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="doc-s">
          {Number(order.discountAmount) > 0 && (
            <div className="sum-r is-off"><span>Скидка</span><span className="num">−{formatPrice(Number(order.discountAmount))}</span></div>
          )}
          <div className="sum-r"><span>Доставка</span><span className="num">{Number(order.deliveryCost) === 0 ? "бесплатно" : formatPrice(Number(order.deliveryCost))}</span></div>
          <div className="sum-t"><span>Итого</span><span className="num">{formatPrice(Number(order.total))}</span></div>
        </div>
      </div>

      {order.trackNumber && (
        <p className="pdp-note" style={{ marginTop: 16 }}>Трек-номер отправления: <b>{order.trackNumber}</b></p>
      )}
      {order.status === "AWAITING_PAYMENT" && (
        <p className="hint" style={{ marginTop: 16 }}>Заказ ожидает оплаты. Подтверждение придёт после оплаты картой.</p>
      )}
      {order.customerType === "LEGAL" && (
        <p className="pdp-note" style={{ marginTop: 16 }}>
          Оплата по счёту.{" "}
          <a href={`/api/invoice/${order.number}`} target="_blank" rel="noopener" style={{ color: "var(--rso-blue)", fontWeight: 600 }}>
            Скачать счёт (PDF)
          </a>
        </p>
      )}

      <div className="row-btns" style={{ marginTop: 24 }}>
        <Link href="/" className="btn btn-ghost btn-m">На главную</Link>
        <Link href="/catalog/futbolki" className="btn btn-outline btn-m">Продолжить покупки</Link>
      </div>
    </div>
  );
}
