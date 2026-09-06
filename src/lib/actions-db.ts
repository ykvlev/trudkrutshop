// DB-версия серверных действий (запись). Пока НЕ подключена — как prisma-repo.ts.
// Активация после `npm install && npm run db:migrate && npm run db:seed`:
// в lib/actions.ts вызвать эти функции внутри соответствующих server actions
// (за флагом наличия БД). Здесь собрана реальная персистентность с соблюдением
// инвариантов плана: цена — снимок, остаток — только через журнал, бронь между
// «оформил» и «оплатил».

import { prisma } from "@/lib/prisma";
import { computeTotals, round2, type CartLine } from "@/domain/pricing";
import { recordMovement, reserve, shipReservation } from "@/domain/stock";
import { enqueue } from "@/jobs";
import type { CustomerType, OrderStatus, StockReason } from "@prisma/client";

const LEGAL_DISCOUNT = 0.1;

// Позиция заказа на уровне варианта (как только корзина станет вариант-ориентированной).
export type OrderLineInput = { variantId: string; quantity: number };

export type CreateOrderInput = {
  lines: OrderLineInput[];
  customerType: CustomerType;
  contact: { name: string; phone: string; email: string; comment?: string };
  promoCode?: string;
  deliveryType: "SAFEROUTE" | "PICKUP";
  deliveryCost: number;
  legalEntityId?: string;
};

function genOrderNumber(): string {
  return "ТКШ-" + String(Date.now()).slice(-6);
}

/** Оформление заказа в одной транзакции: снимок цен, бронь остатка, история. */
export async function createOrderDb(input: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    // Тянем варианты с товаром и ценой (снимок берём отсюда).
    const variants = await tx.productVariant.findMany({
      where: { id: { in: input.lines.map((l) => l.variantId) } },
      include: { product: { include: { category: true } } },
    });
    const byId = new Map(variants.map((v) => [v.id, v]));

    // Считаем итоги через доменную логику.
    const cartLines: CartLine[] = input.lines.map((l) => {
      const v = byId.get(l.variantId);
      if (!v) throw new Error(`Вариант не найден: ${l.variantId}`);
      return { price: Number(v.price), quantity: l.quantity, categorySlug: v.product.category.slug };
    });

    let promo = null;
    if (input.promoCode) {
      const pc = await tx.promoCode.findUnique({ where: { code: input.promoCode } });
      if (pc && pc.isActive) {
        promo = { type: pc.type, value: Number(pc.value), minAmount: pc.minAmount ? Number(pc.minAmount) : null, categoryScope: pc.categoryScope };
      }
    }

    const t = computeTotals({ lines: cartLines, promo, deliveryCost: input.deliveryCost });
    const legalDiscount = input.customerType === "LEGAL" ? round2((t.subtotal - t.discount) * LEGAL_DISCOUNT) : 0;
    const total = round2(t.total - legalDiscount);
    const status: OrderStatus = input.customerType === "LEGAL" ? "NEW_LEGAL" : "AWAITING_PAYMENT";

    const order = await tx.order.create({
      data: {
        number: genOrderNumber(),
        status,
        customerType: input.customerType,
        customerName: input.contact.name,
        phone: input.contact.phone,
        email: input.contact.email,
        comment: input.contact.comment,
        deliveryType: input.deliveryType,
        deliveryCost: input.deliveryCost,
        discountAmount: round2(t.discount + legalDiscount),
        subtotal: t.subtotal,
        total,
        legalEntityId: input.legalEntityId,
        items: {
          create: input.lines.map((l) => {
            const v = byId.get(l.variantId)!;
            return {
              variantId: v.id,
              nameSnapshot: v.product.name,
              skuSnapshot: v.sku,
              priceSnapshot: v.price, // снимок — не меняется при смене прайса
              quantity: l.quantity,
            };
          }),
        },
        statusHistory: { create: { toStatus: status, comment: "Заказ создан" } },
      },
    });

    // Бронь остатка на время оплаты (иначе двое купят последнюю футболку).
    for (const l of input.lines) {
      await reserve(tx, l.variantId, l.quantity);
    }

    return { id: order.id, number: order.number, total };
  });
}

/** Смена статуса заказа с записью в историю. Переход в SHIPPED списывает товар. */
export async function changeOrderStatusDb(orderId: string, to: OrderStatus, adminUserId?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });

    if (to === "SHIPPED" && order.status !== "SHIPPED") {
      // Правило плана: смена на «отправлен» списывает товар (движение) и снимает бронь.
      for (const it of order.items) {
        if (it.variantId) await shipReservation(tx, { variantId: it.variantId, qty: it.quantity, orderId, adminUserId });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: to,
        ...(to === "PAID_PHYSICAL" || to === "PAID_LEGAL" ? { paidAt: new Date() } : {}),
        ...(to === "SHIPPED" ? { shippedAt: new Date() } : {}),
        statusHistory: { create: { fromStatus: order.status, toStatus: to, adminUserId } },
      },
    });

    return order;
  }).then(async (order) => {
    // Письмо об отправке — в очередь (после коммита; ошибка очереди не критична).
    if (to === "SHIPPED" && order.status !== "SHIPPED") {
      await enqueue("email.order-shipped", { orderId, trackNumber: order.trackNumber ?? "" });
    }
  });
}

/** Привязать id платежа к заказу (после создания платежа в Точке) —
 * чтобы вебхук об оплате нашёл заказ по paymentId. */
export async function setOrderPayment(orderId: string, paymentId: string) {
  await prisma.order.update({ where: { id: orderId }, data: { paymentId } });
}

/** Ручное движение по складу из админки (приёмка/списание/возврат). */
export async function recordStockMovementDb(input: {
  variantId: string; delta: number; reason: StockReason; adminUserId?: string; comment?: string;
}) {
  return prisma.$transaction((tx) => recordMovement(tx, input));
}

/** Создание/обновление товара из админки. */
export async function upsertProductDb(input: {
  id?: string; slug: string; name: string; categoryId: string; basePrice: number; isActive: boolean;
}) {
  const data = {
    slug: input.slug, name: input.name, categoryId: input.categoryId,
    basePrice: input.basePrice, isActive: input.isActive,
  };
  return input.id
    ? prisma.product.update({ where: { id: input.id }, data })
    : prisma.product.create({ data: { ...data, publishedAt: new Date() } });
}

function genCertCode(): string {
  const g = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RSO-${g()}-${g()}-${g()}`;
}

/** Покупка сертификата: создаём запись (аванс по 54-ФЗ), баланс = номинал,
 * статус PENDING; отложенную отправку получателю ставит в очередь вызывающий. */
export async function createCertificateDb(input: {
  amount: number;
  recipientEmail?: string;
  recipientPhone?: string;
  sendAt?: string | null;
}) {
  const cert = await prisma.certificate.create({
    data: {
      code: genCertCode(),
      nominal: input.amount,
      balance: input.amount,
      recipientEmail: input.recipientEmail || null,
      recipientPhone: input.recipientPhone || null,
      sendAt: input.sendAt ? new Date(input.sendAt) : null,
      status: "PENDING",
    },
  });
  return { id: cert.id, code: cert.code };
}

/** Отмена брони по таймауту неоплаты (запускается фоновой задачей pg-boss). */
export async function releaseExpiredReservations(olderThanMinutes = 30) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  const stale = await prisma.order.findMany({
    where: { status: "AWAITING_PAYMENT", createdAt: { lt: cutoff } },
    include: { items: true },
  });
  for (const order of stale) {
    await prisma.$transaction(async (tx) => {
      for (const it of order.items) {
        if (it.variantId) {
          await tx.productVariant.update({
            where: { id: it.variantId },
            data: { reserved: { decrement: it.quantity } },
          });
        }
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", statusHistory: { create: { fromStatus: "AWAITING_PAYMENT", toStatus: "CANCELLED", comment: "Бронь снята по таймауту" } } },
      });
    });
  }
  return stale.length;
}
