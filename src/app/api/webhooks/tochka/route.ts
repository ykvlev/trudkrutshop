import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/integrations/payment";

// Вебхук об оплате от Точки. Подтверждение оплаты приходит ТОЛЬКО сюда
// (не по редиректу). Провайдер проверяет подпись; заказ ищем по paymentId.
// Реальный тест — после подключения ключей ЛК Точки.

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-signature") ?? req.headers.get("signature");

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    payload = { raw: body };
  }

  try {
    const evt = await getPaymentProvider().parseWebhook(body, signature);
    await prisma.integrationLog.create({
      data: { system: "TOCHKA", direction: "in", event: evt.status, payload: payload as object, status: "received" },
    });

    const order = await prisma.order.findFirst({ where: { paymentId: evt.paymentId } });
    if (order) {
      if (evt.status === "paid" && order.paymentStatus !== "PAID") {
        const to = order.customerType === "LEGAL" ? "PAID_LEGAL" : "PAID_PHYSICAL";
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID", status: to, paidAt: new Date(),
            statusHistory: { create: { fromStatus: order.status, toStatus: to, comment: "Оплата подтверждена (вебхук Точки)" } },
          },
        });
      } else if (evt.status === "failed") {
        await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
      } else if (evt.status === "refunded") {
        await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "REFUNDED" } });
      }
    }

    return Response.json({ ok: true });
  } catch (e) {
    await prisma.integrationLog
      .create({ data: { system: "TOCHKA", direction: "in", status: "error", event: String(e), payload: payload as object } })
      .catch(() => {});
    return new Response("invalid webhook", { status: 400 });
  }
}
