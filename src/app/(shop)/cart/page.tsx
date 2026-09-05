"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/shop/cart-provider";
import { ProductThumb } from "@/components/shop/product-thumb";
import { IconClose } from "@/components/shop/icons";
import { formatPrice } from "@/lib/format";
import { computeTotals, round2, type Promo } from "@/domain/pricing";
import { products } from "@/lib/test-data";
import { lookupCompanyByInn, placeOrder, validatePromo } from "@/lib/actions";

const DELIVERY = [
  { code: "pickup", title: "Самовывоз", sub: "Москва, Лефортовский пер., 8", cost: 0 },
  { code: "pvz", title: "Пункт выдачи (SafeRoute)", sub: "2–5 дней", cost: 250 },
  { code: "courier", title: "Курьером до двери", sub: "1–3 дня", cost: 450 },
];

const LEGAL_DISCOUNT = 0.1; // 10% для юрлиц (демо; условие уточняет заказчик)

type Entity = { inn: string; name: string; kpp: string; ogrn: string; address: string };

export default function CartPage() {
  const cart = useCart();
  const lines = cart.items
    .map((i) => ({ item: i, product: products.find((p) => p.id === i.productId)! }))
    .filter((x) => x.product);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; promo: Promo } | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const [delivery, setDelivery] = useState("pvz");
  const [legal, setLegal] = useState(false);
  const [inn, setInn] = useState("");
  const [entity, setEntity] = useState<Entity | null>(null);
  const [done, setDone] = useState<null | { number: string; legal: boolean; total: number; paymentUrl?: string }>(null);

  const deliveryCost = DELIVERY.find((d) => d.code === delivery)?.cost ?? 0;

  const totals = useMemo(() => {
    const cl = lines.map(({ item, product }) => ({
      price: product.price,
      quantity: item.qty,
      categorySlug: product.category,
    }));
    const t = computeTotals({ lines: cl, promo: promo?.promo ?? null, deliveryCost });
    const legalDiscount = legal && entity ? round2((t.subtotal - t.discount) * LEGAL_DISCOUNT) : 0;
    return { ...t, legalDiscount, total: round2(t.total - legalDiscount) };
  }, [lines, promo, deliveryCost, legal, entity]);

  const applyPromo = async () => {
    const res = await validatePromo(promoInput);
    if (!res.ok) { setPromoErr(res.error); setPromo(null); return; }
    setPromoErr(""); setPromo({ code: res.code, promo: res.promo });
  };

  const lookupInn = async () => {
    const c = await lookupCompanyByInn(inn);
    if (!c) { setEntity(null); return; }
    setEntity({ inn: c.inn, name: c.name, kpp: c.kpp ?? "", ogrn: c.ogrn ?? "", address: c.legalAddress ?? "" });
  };

  const submit = async (asLegal: boolean) => {
    const cl = lines.map(({ item, product }) => ({ price: product.price, quantity: item.qty, categorySlug: product.category }));
    const res = await placeOrder({
      lines: cl,
      promoCode: promo?.code,
      deliveryCost,
      legal: asLegal,
      inn: entity?.inn,
      contact: { name: "", phone: "", email: "" },
    });
    setDone({ number: res.number, legal: asLegal, total: res.total, paymentUrl: res.paymentUrl });
    cart.clear();
  };

  if (done) return <OrderDone done={done} entity={entity} />;

  if (lines.length === 0) {
    return (
      <div className="wrap" style={{ padding: "48px 0 80px", textAlign: "center" }}>
        <h1>Корзина пуста</h1>
        <p className="seo" style={{ margin: "0 auto 24px" }}>Загляните в каталог — там весь отрядный мерч.</p>
        <Link href="/catalog/futbolki" className="btn btn-blue btn-l">В каталог</Link>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ padding: "24px 0 60px" }}>
      <h1>Корзина</h1>
      <div className="cart">
        <div>
          {/* Позиции */}
          <table className="ctable">
            <thead>
              <tr><th>Товар</th><th>Цена</th><th>Кол-во</th><th>Сумма</th><th></th></tr>
            </thead>
            <tbody>
              {lines.map(({ item, product }) => (
                <tr key={product.id}>
                  <td>
                    <div className="ci">
                      <div className="ci-img"><ProductThumb label={product.name} /></div>
                      <div>
                        <Link href={`/product/${product.slug}`} className="ci-n">{product.name}</Link>
                        <div className="ci-v">{product.variants[0]?.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num">{formatPrice(product.price)}</td>
                  <td>
                    <div className="qty">
                      <button type="button" onClick={() => cart.setQty(product.id, item.qty - 1)} aria-label="Меньше">−</button>
                      <span className="num">{item.qty}</span>
                      <button type="button" onClick={() => cart.setQty(product.id, item.qty + 1)} aria-label="Больше">+</button>
                    </div>
                  </td>
                  <td className="num">{formatPrice(product.price * item.qty)}</td>
                  <td>
                    <button type="button" className="ibtn" aria-label="Удалить" onClick={() => cart.remove(product.id)}>
                      <IconClose width={18} height={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Промокод */}
          <div className="cbox">
            <span className="fld-l">Промокод или сертификат</span>
            <div className="promo">
              <input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Например, РСО10" aria-label="Промокод" />
              <button type="button" className="btn btn-outline btn-m" onClick={applyPromo}>Применить</button>
            </div>
            {promo && <div className="ok">Промокод «{promo.code}» применён</div>}
            {promoErr && <div className="bad">{promoErr}</div>}
          </div>

          {/* Контакты */}
          <h2 style={{ margin: "28px 0 14px" }}>Контакты</h2>
          <div className="fgrid">
            <label className="fld"><span className="fld-l">Имя</span><input placeholder="Иван" /></label>
            <label className="fld"><span className="fld-l">Телефон</span><input placeholder="+7 900 000-00-00" /></label>
            <label className="fld"><span className="fld-l">E-mail</span><input placeholder="you@mail.ru" /></label>
          </div>

          {/* Доставка */}
          <h2 style={{ margin: "28px 0 14px" }}>Доставка</h2>
          <div className="dlist">
            {DELIVERY.map((d) => (
              <label key={d.code} className={`dopt${delivery === d.code ? " is-on" : ""}`}>
                <input type="radio" name="delivery" checked={delivery === d.code} onChange={() => setDelivery(d.code)} />
                <span>
                  <span className="dopt-t">{d.title}</span>
                  <span className="dopt-s">{d.sub}</span>
                </span>
                <span className="dopt-p num">{d.cost === 0 ? "бесплатно" : formatPrice(d.cost)}</span>
              </label>
            ))}
          </div>

          <label className="fld" style={{ marginTop: 12 }}>
            <span className="fld-l">Комментарий к заказу</span>
            <textarea rows={3} placeholder="Пожелания по заказу" />
          </label>

          {/* Юрлицо */}
          <h2 style={{ margin: "28px 0 14px" }}>Юридическим лицам</h2>
          <label className="dopt" style={{ marginBottom: 14 }}>
            <input type="checkbox" checked={legal} onChange={(e) => setLegal(e.target.checked)} />
            <span><span className="dopt-t">Оформить заказ как юридическое лицо</span>
              <span className="dopt-s">Счёт на оплату и УПД, скидка 10%</span></span>
          </label>
          {legal && (
            <>
              <div className="inn">
                <label className="fld"><span className="fld-l">ИНН</span>
                  <input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="10 или 12 цифр" inputMode="numeric" />
                </label>
                <button type="button" className="btn btn-outline btn-m" onClick={lookupInn}>Подтянуть реквизиты</button>
              </div>
              {entity && (
                <div className="ent">
                  <div className="ent-n">{entity.name}</div>
                  <dl>
                    <dt>ИНН</dt><dd>{entity.inn}</dd>
                    <dt>КПП</dt><dd>{entity.kpp}</dd>
                    <dt>ОГРН</dt><dd>{entity.ogrn}</dd>
                    <dt>Адрес</dt><dd>{entity.address}</dd>
                  </dl>
                </div>
              )}
            </>
          )}
        </div>

        {/* Итоги */}
        <aside className="sum">
          <div className="sum-r"><span>Товары ({cart.count})</span><span className="num">{formatPrice(totals.subtotal)}</span></div>
          {totals.discount > 0 && <div className="sum-r is-off"><span>Скидка по промокоду</span><span className="num">−{formatPrice(totals.discount)}</span></div>}
          {totals.legalDiscount > 0 && <div className="sum-r is-off"><span>Скидка юрлицу</span><span className="num">−{formatPrice(totals.legalDiscount)}</span></div>}
          <div className="sum-r"><span>Доставка</span><span className="num">{deliveryCost === 0 ? "бесплатно" : formatPrice(deliveryCost)}</span></div>
          <div className="sum-t"><span>Итого</span><span className="num">{formatPrice(totals.total)}</span></div>

          {legal ? (
            <button type="button" className="btn btn-blue btn-l" disabled={!entity} onClick={() => submit(true)}>
              Выставить счёт
            </button>
          ) : (
            <button type="button" className="btn btn-blue btn-l" onClick={() => submit(false)}>
              Оформить заказ
            </button>
          )}
          <p className="sum-n">
            {legal
              ? "Оплата по счёту. УПД формируется после оплаты."
              : "Оплата картой на защищённой странице Точки. Подтверждение — по чеку."}
          </p>
        </aside>
      </div>
    </div>
  );
}

function OrderDone({
  done,
  entity,
}: {
  done: { number: string; legal: boolean; total: number; paymentUrl?: string };
  entity: Entity | null;
}) {
  return (
    <div className="wrap" style={{ padding: "40px 0 80px" }}>
      <div className="okhead">
        <div>
          <h1>Заказ {done.number} оформлен</h1>
          <p>Мы отправили состав заказа на вашу почту. {done.legal ? "Счёт на оплату — ниже." : "Дальше — оплата картой."}</p>
        </div>
      </div>

      {done.legal ? (
        <div className="doc">
          <div className="doc-h">
            <div>
              <div className="doc-n">Счёт на оплату № {done.number}</div>
              <div className="hint">от {new Date().toLocaleDateString("ru-RU")}</div>
            </div>
            <span className="badge badge-ok">Ожидает оплаты</span>
          </div>
          <div className="doc-p">
            <p><b>Поставщик:</b><br />АНО ДПО «РСО-РАЗВИТИЕ»<br />ИНН 7743351523 · КПП 770101001</p>
            <p><b>Покупатель:</b><br />{entity?.name ?? "—"}<br />ИНН {entity?.inn ?? "—"} · КПП {entity?.kpp ?? "—"}</p>
          </div>
          <div className="doc-s">
            <div className="sum-t"><span>К оплате</span><span className="num">{formatPrice(done.total)}</span></div>
          </div>
          <div className="doc-f">
            <span className="hint">Оплата в течение 5 рабочих дней. После оплаты — УПД через ЭДО.</span>
            <span className="doc-stamp">Место для подписи и печати</span>
          </div>
        </div>
      ) : (
        <div className="paystate">
          <span className="badge badge-warn">Ожидает оплаты</span>
          <span className="num">{formatPrice(done.total)}</span>
          <a href={done.paymentUrl ?? "#"} className="btn btn-blue btn-l">Перейти к оплате</a>
        </div>
      )}

      <div className="row-btns">
        <Link href="/" className="btn btn-ghost btn-m">На главную</Link>
        <Link href="/catalog/futbolki" className="btn btn-outline btn-m">Продолжить покупки</Link>
      </div>
    </div>
  );
}
