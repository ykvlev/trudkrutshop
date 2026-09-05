// Обработчики фоновых задач. Импортируют prisma/интеграции — файл НЕ подключён
// к рантайму витрины (как actions-db.ts): его загружает только worker.ts.
// Активируется вместе с БД и pg-boss.

import { prisma } from "@/lib/prisma";
import { getEmailProvider } from "@/integrations/email";
import { getCrmProvider } from "@/integrations/crm";
import { recordMovement } from "@/domain/stock";
import { releaseExpiredReservations } from "@/lib/actions-db";
import { orderConfirmationEmail, orderShippedEmail, certificateEmail } from "@/emails";
import type { JobPayloads } from "./types";

/** Отложенная отправка сертификата получателю. */
export async function certificateSend({ certificateId }: JobPayloads["certificate.send"]) {
  const cert = await prisma.certificate.findUnique({ where: { id: certificateId } });
  if (!cert || !cert.recipientEmail) return;
  // Позже: сгенерировать картинку сертификата с кодом (sharp) и приложить.
  const mail = certificateEmail({ code: cert.code, nominal: Number(cert.nominal) });
  await getEmailProvider().send({ to: cert.recipientEmail, subject: mail.subject, html: mail.html });
  await prisma.certificate.update({
    where: { id: certificateId },
    data: { sentAt: new Date(), status: "ACTIVE" },
  });
}

/** Письмо с составом заказа после оформления. */
export async function orderConfirmation({ orderId }: JobPayloads["email.order-confirmation"]) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  const mail = orderConfirmationEmail({
    number: order.number,
    items: order.items.map((i) => ({ name: i.nameSnapshot, qty: i.quantity, price: Number(i.priceSnapshot) })),
    total: Number(order.total),
    payLegal: order.customerType === "LEGAL",
  });
  await getEmailProvider().send({ to: order.email, subject: mail.subject, html: mail.html });
}

/** Письмо с трек-номером после создания отправления. */
export async function orderShipped({ orderId, trackNumber }: JobPayloads["email.order-shipped"]) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const mail = orderShippedEmail({ number: order.number, trackNumber });
  await getEmailProvider().send({ to: order.email, subject: mail.subject, html: mail.html });
}

/** Снятие брони по таймауту неоплаты (cron). */
export async function reservationRelease({ olderThanMinutes }: JobPayloads["reservation.release"]) {
  const n = await releaseExpiredReservations(olderThanMinutes ?? 30);
  if (n) console.info(`[jobs] снята бронь у ${n} неоплаченных заказов`);
}

/** Повтор обработки вебхука при сбое (оплата/доставка). */
export async function webhookRetry({ system, logId }: JobPayloads["webhook.retry"]) {
  const log = await prisma.integrationLog.findUnique({ where: { id: logId } });
  if (!log) return;
  // Позже: заново применить payload через соответствующий провайдер и обновить статус лога.
  console.info(`[jobs] повтор вебхука ${system} (${logId})`);
}

/** Синхронизация остатков из учётной системы (cron). */
export async function crmSync() {
  const rows = await getCrmProvider().pullStock();
  for (const row of rows) {
    const variant = await prisma.productVariant.findUnique({ where: { sku: row.sku } });
    if (!variant) continue;
    const delta = row.stock - variant.stock;
    if (delta !== 0) {
      await prisma.$transaction((tx) =>
        recordMovement(tx, { variantId: variant.id, delta, reason: "SYNC", comment: "Синхронизация с учётной системой" }),
      );
    }
  }
}
