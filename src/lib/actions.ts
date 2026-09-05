"use server";

// Серверные действия витрины. Клиентские экраны вызывают их вместо локальной
// логики — так бизнес-правила и интеграции живут на сервере.
// Сейчас: доменные расчёты + провайдеры в mock-режиме (ключей нет).
// Позже: те же функции добавляют запись в БД (Prisma) и боевые интеграции —
// сигнатуры и вызовы на клиенте не меняются.

import { computeTotals, round2, type Promo } from "@/domain/pricing";
import { getDadataProvider, type CompanyDetails } from "@/integrations/dadata";
import { getDeliveryProvider, type DeliveryQuote } from "@/integrations/delivery";
import { getPaymentProvider } from "@/integrations/payment";
import { createOrderDb } from "@/lib/actions-db";
import { enqueue } from "@/jobs";

const LEGAL_DISCOUNT = 0.1; // условие уточняет заказчик

// Промокоды — источник заменится на БД (модель PromoCode).
const PROMOS: Record<string, Promo> = {
  "РСО10": { type: "PERCENT", value: 10 },
  "ТРУДКРУТ": { type: "FIXED", value: 300, minAmount: 1000 },
};

/** Реквизиты юрлица по ИНН (DaData). */
export async function lookupCompanyByInn(inn: string): Promise<CompanyDetails | null> {
  return getDadataProvider().findCompanyByInn(inn.trim());
}

/** Проверка промокода. Возвращает промо или причину отказа. */
export async function validatePromo(
  code: string,
): Promise<{ ok: true; code: string; promo: Promo } | { ok: false; error: string }> {
  const key = code.trim().toUpperCase();
  const promo = PROMOS[key];
  if (!promo) return { ok: false, error: "Промокод не найден" };
  return { ok: true, code: key, promo };
}

/** Расчёт доставки (SafeRoute). В mock-режиме — примерные тарифы. */
export async function calcDelivery(input: {
  weightG: number;
  toPostcode?: string;
}): Promise<DeliveryQuote[]> {
  return getDeliveryProvider().calculate({
    weightG: input.weightG,
    dims: { length: 300, width: 250, height: 60 },
    declaredValue: 0,
    toPostcode: input.toPostcode,
  });
}

export type PlaceOrderLine = {
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  categorySlug?: string;
};

export type PlaceOrderInput = {
  lines: PlaceOrderLine[];
  promoCode?: string;
  deliveryType: "SAFEROUTE" | "PICKUP";
  deliveryCost: number;
  legal: boolean;
  inn?: string;
  contact: { name: string; phone: string; email: string; comment?: string };
};

export type PlaceOrderResult = {
  number: string;
  total: number;
  kind: "physical" | "legal";
  paymentUrl?: string; // для физлица — страница оплаты Точки
};

/** Оформление заказа: расчёт итогов, для физлица — создание платежа (Точка),
 * для юрлица — счёт. Резервирование остатка и запись в БД добавятся с Prisma. */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  let number: string;
  let total: number;

  try {
    // Основной путь: создаём заказ в БД (снимок цен, бронь остатка, история).
    const order = await createOrderDb({
      lines: input.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      customerType: input.legal ? "LEGAL" : "PHYSICAL",
      contact: input.contact,
      promoCode: input.promoCode,
      deliveryType: input.deliveryType,
      deliveryCost: input.deliveryCost,
    });
    number = order.number;
    total = order.total;
  } catch {
    // Фолбэк без БД (демо-режим на тестовых данных): расчёт без записи.
    const promoRes = input.promoCode ? await validatePromo(input.promoCode) : null;
    const promo = promoRes && promoRes.ok ? promoRes.promo : null;
    const t = computeTotals({ lines: input.lines, promo, deliveryCost: input.deliveryCost });
    const legalDiscount = input.legal ? round2((t.subtotal - t.discount) * LEGAL_DISCOUNT) : 0;
    total = round2(t.total - legalDiscount);
    number = "ТКШ-" + String(Date.now()).slice(-6);
  }

  // Письмо с составом заказа — в очередь (сейчас no-op, позже pg-boss).
  await enqueue("email.order-confirmation", { orderId: number });

  if (input.legal) {
    // Юрлицо: счёт на оплату, оплата подтверждается менеджером; далее УПД через ЭДО.
    return { number, total, kind: "legal" };
  }

  // Физлицо: платёж через Точку (mock → внутренний sandbox-URL).
  const payment = await getPaymentProvider().createPayment({
    orderId: number,
    orderNumber: number,
    amount: total,
    description: `Заказ ${number} — ТрудКрутШоп`,
    customerEmail: input.contact.email || "guest@trudkrutshop.ru",
    returnUrl: `/order/${number}`,
    lines: input.lines.map((l) => ({
      name: "Товар",
      price: l.price,
      quantity: l.quantity,
      vat: "vat20",
      paymentSubject: "commodity",
    })),
  });

  return { number, total, kind: "physical", paymentUrl: payment.paymentUrl };
}

/** Покупка сертификата: аванс по 54-ФЗ, отложенная отправка получателю. */
export async function createCertificateOrder(input: {
  design: string;
  amount: number;
  recipientEmail: string;
  recipientPhone: string;
  sendAt: string | null;
}): Promise<{ ok: true; amount: number } | { ok: false; error: string }> {
  if (input.amount < 100) return { ok: false, error: "Минимальный номинал — 100 ₽" };
  // Позже: создать Certificate (status PENDING) и пробить чек-аванс; сюда придёт
  // реальный id. Отложенную отправку получателю ставим в очередь на sendAt.
  await enqueue(
    "certificate.send",
    { certificateId: "pending" },
    input.sendAt ? { startAfter: new Date(input.sendAt) } : undefined,
  );
  return { ok: true, amount: input.amount };
}
