"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/shop/cart-provider";
import { ProductThumb } from "@/components/shop/product-thumb";
import { IconClose } from "@/components/shop/icons";
import { formatPrice } from "@/lib/format";
import { computeTotals, round2, type Promo } from "@/domain/pricing";
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
  const items = cart.items;

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; promo: Promo } | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const [delivery, setDelivery] = useState("pvz");
  const [legal, setLegal] = useState(false);
  const [inn, setInn] = useState("");
  const [entity, setEntity] = useState<Entity | null>(null);
  const [done, setDone] = useState<null | { number: string; legal: boolean; total: number; paymentUrl?: string }>(null);

  // Контакты и доставка.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [touched, setTouched] = useState(false); // показывать ошибки только после попытки отправки
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  const deliveryCost = DELIVERY.find((d) => d.code === delivery)?.cost ?? 0;
  const needsAddress = delivery !== "pickup"; // самовывоз адрес не требует

  // Валидация полей (клиентская; сервер дублирует как страховку).
  const errors = {
    name: name.trim().length < 2 ? "Укажите имя" : "",
    phone: phone.replace(/\D/g, "").length < 10 ? "Укажите корректный телефон" : "",
    email: /^\S+@\S+\.\S+$/.test(email.trim()) ? "" : "Укажите корректный e-mail",
    city: needsAddress && !city.trim() ? "Укажите город" : "",
    address: needsAddress && !address.trim() ? (delivery === "pvz" ? "Укажите пункт выдачи" : "Укажите адрес") : "",
    entity: legal && !entity ? "Подтяните реквизиты по ИНН" : "",
  };
  const isValid = !Object.values(errors).some(Boolean);
  const err = (k: keyof typeof errors) => (touched && errors[k] ? errors[k] : "");

  const totals = useMemo(() => {
    const cl = items.map((i) => ({ price: i.price, quantity: i.qty, categorySlug: i.category }));
    const t = computeTotals({ lines: cl, promo: promo?.promo ?? null, deliveryCost });
    const legalDiscount = legal && entity ? round2((t.subtotal - t.discount) * LEGAL_DISCOUNT) : 0;
    return { ...t, legalDiscount, total: round2(t.total - legalDiscount) };
  }, [items, promo, deliveryCost, legal, entity]);

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
    setTouched(true);
    setSubmitErr("");
    if (!isValid) return;
    setSubmitting(true);
    try {
      const res = await placeOrder({
        lines: items.map((i) => ({
          variantId: i.variantId, name: i.name, price: i.price, quantity: i.qty, categorySlug: i.category,
        })),
        promoCode: promo?.code,
        deliveryType: delivery === "pickup" ? "PICKUP" : "SAFEROUTE",
        deliveryCost,
        deliveryData: needsAddress
          ? { city: city.trim(), address: address.trim(), method: delivery }
          : { method: "pickup" },
        legal: asLegal,
        inn: entity?.inn,
        contact: { name: name.trim(), phone: phone.trim(), email: email.trim(), comment: comment.trim() || undefined },
      });
      setDone({ number: res.number, legal: asLegal, total: res.total, paymentUrl: res.paymentUrl });
      cart.clear();
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : "Не удалось оформить заказ. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <OrderDone done={done} entity={entity} />;

  if (items.length === 0) {
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
              {items.map((i) => (
                <tr key={i.variantId}>
                  <td>
                    <div className="ci">
                      <div className="ci-img"><ProductThumb label={i.name} category={i.category} /></div>
                      <div>
                        <Link href={`/product/${i.slug}`} className="ci-n">{i.name}</Link>
                        <div className="ci-v">{i.variantLabel ? `${i.variantLabel} · ` : ""}{i.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num">{formatPrice(i.price)}</td>
                  <td>
                    <div className="qty">
                      <button type="button" onClick={() => cart.setQty(i.variantId, i.qty - 1)} aria-label="Меньше">−</button>
                      <span className="num">{i.qty}</span>
                      <button type="button" onClick={() => cart.setQty(i.variantId, i.qty + 1)} aria-label="Больше">+</button>
                    </div>
                  </td>
                  <td className="num">{formatPrice(i.price * i.qty)}</td>
                  <td>
                    <button type="button" className="ibtn" aria-label="Удалить" onClick={() => cart.remove(i.variantId)}>
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
            <label className="fld">
              <span className="fld-l">Имя <span aria-hidden style={{ color: "var(--rso-alert)" }}>*</span></span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван" aria-invalid={!!err("name")} required />
              {err("name") && <span className="bad">{err("name")}</span>}
            </label>
            <label className="fld">
              <span className="fld-l">Телефон <span aria-hidden style={{ color: "var(--rso-alert)" }}>*</span></span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" inputMode="tel" aria-invalid={!!err("phone")} required />
              {err("phone") && <span className="bad">{err("phone")}</span>}
            </label>
            <label className="fld">
              <span className="fld-l">E-mail <span aria-hidden style={{ color: "var(--rso-alert)" }}>*</span></span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.ru" inputMode="email" type="email" aria-invalid={!!err("email")} required />
              {err("email") && <span className="bad">{err("email")}</span>}
            </label>
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

          {needsAddress && (
            <div className="fgrid" style={{ marginTop: 12 }}>
              <label className="fld">
                <span className="fld-l">Город <span aria-hidden style={{ color: "var(--rso-alert)" }}>*</span></span>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" aria-invalid={!!err("city")} required />
                {err("city") && <span className="bad">{err("city")}</span>}
              </label>
              <label className="fld">
                <span className="fld-l">
                  {delivery === "pvz" ? "Пункт выдачи" : "Адрес доставки"} <span aria-hidden style={{ color: "var(--rso-alert)" }}>*</span>
                </span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={delivery === "pvz" ? "Адрес ПВЗ или его код" : "Улица, дом, квартира"}
                  aria-invalid={!!err("address")}
                  required
                />
                {err("address") && <span className="bad">{err("address")}</span>}
              </label>
            </div>
          )}

          <label className="fld" style={{ marginTop: 12 }}>
            <span className="fld-l">Комментарий к заказу</span>
            <textarea rows={3} placeholder="Пожелания по заказу" value={comment} onChange={(e) => setComment(e.target.value)} />
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
            <button type="button" className="btn btn-blue btn-l" disabled={submitting} onClick={() => submit(true)}>
              {submitting ? "Оформляем…" : "Выставить счёт"}
            </button>
          ) : (
            <button type="button" className="btn btn-blue btn-l" disabled={submitting} onClick={() => submit(false)}>
              {submitting ? "Оформляем…" : "Оформить заказ"}
            </button>
          )}
          {touched && !isValid && <p className="bad" style={{ marginTop: 10 }}>Заполните обязательные поля, отмеченные звёздочкой.</p>}
          {submitErr && <p className="bad" style={{ marginTop: 10 }}>{submitErr}</p>}
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
              <div className="hint">Покупатель: {entity?.name ?? "—"}{entity?.inn ? ` · ИНН ${entity.inn}` : ""}</div>
            </div>
            <span className="badge badge-warn">Ожидает оплаты</span>
          </div>
          <div className="doc-s">
            <div className="sum-t"><span>К оплате</span><span className="num">{formatPrice(done.total)}</span></div>
          </div>
          <div className="row-btns" style={{ marginTop: 8 }}>
            <a href={`/api/invoice/${done.number}`} target="_blank" rel="noopener" className="btn btn-blue btn-m">Скачать счёт (PDF)</a>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>Счёт также отправлен на вашу почту. После оплаты сформируем УПД.</p>
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
