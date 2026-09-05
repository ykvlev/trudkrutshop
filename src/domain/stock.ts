// Складской контур. Железное правило (план §5): остаток НИКОГДА не меняется
// напрямую — только через движение (StockMovement). Иначе через месяц никто
// не объяснит, куда делись пять худи.

import type { Prisma, StockReason } from "@prisma/client";

/** Prisma-транзакция или сам клиент — обе поддерживают нужные модели. */
type Tx = Prisma.TransactionClient;

export type MovementInput = {
  variantId: string;
  delta: number; // > 0 приход, < 0 расход
  reason: StockReason;
  orderId?: string;
  adminUserId?: string;
  comment?: string;
};

/** Записать движение и синхронно обновить остаток варианта. Вызывать внутри
 * транзакции (recordMovement + смежные изменения — атомарно). */
export async function recordMovement(tx: Tx, input: MovementInput) {
  if (input.delta === 0) throw new Error("Движение с нулевой дельтой недопустимо");

  const movement = await tx.stockMovement.create({
    data: {
      variantId: input.variantId,
      delta: input.delta,
      reason: input.reason,
      orderId: input.orderId,
      adminUserId: input.adminUserId,
      comment: input.comment,
    },
  });

  await tx.productVariant.update({
    where: { id: input.variantId },
    data: { stock: { increment: input.delta } },
  });

  return movement;
}

/** Доступно к покупке = остаток минус бронь. */
export function available(variant: { stock: number; reserved: number }): number {
  return Math.max(0, variant.stock - variant.reserved);
}

/** Забронировать под заказ (между «оформил» и «оплатил»). Бросает, если не хватает. */
export async function reserve(tx: Tx, variantId: string, qty: number) {
  const v = await tx.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  if (available(v) < qty) {
    throw new Error(`Недостаточно остатка для брони: ${variantId} (нужно ${qty}, доступно ${available(v)})`);
  }
  await tx.productVariant.update({
    where: { id: variantId },
    data: { reserved: { increment: qty } },
  });
}

/** Снять бронь (оплата не пришла по таймауту, либо отмена). */
export async function release(tx: Tx, variantId: string, qty: number) {
  const v = await tx.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  const next = Math.max(0, v.reserved - qty);
  await tx.productVariant.update({
    where: { id: variantId },
    data: { reserved: next },
  });
}

/** Отгрузка: списываем со склада (движение) и снимаем бронь. Правило плана 6.5:
 * смена статуса на «отправлен» списывает товар, а не наоборот. */
export async function shipReservation(tx: Tx, input: { variantId: string; qty: number; orderId: string; adminUserId?: string }) {
  await recordMovement(tx, {
    variantId: input.variantId,
    delta: -input.qty,
    reason: "ONLINE_SALE",
    orderId: input.orderId,
    adminUserId: input.adminUserId,
    comment: "Отгрузка заказа",
  });
  await release(tx, input.variantId, input.qty);
}
