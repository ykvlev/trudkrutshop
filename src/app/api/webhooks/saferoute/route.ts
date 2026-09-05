import { prisma } from "@/lib/prisma";
import { getDeliveryProvider } from "@/integrations/delivery";

// Вебхук статусов доставки от SafeRoute. Обновляет трек/статус заказа и логирует.
// Реальный тест — после подключения ключей SafeRoute.

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
    const evt = await getDeliveryProvider().parseWebhook(body, signature);
    await prisma.integrationLog.create({
      data: { system: "SAFEROUTE", direction: "in", event: evt.status, payload: payload as object, status: "received" },
    });

    const order = await prisma.order.findFirst({ where: { trackNumber: evt.trackNumber } });
    if (order && !order.trackNumber) {
      await prisma.order.update({ where: { id: order.id }, data: { trackNumber: evt.trackNumber } });
    }

    return Response.json({ ok: true });
  } catch (e) {
    await prisma.integrationLog
      .create({ data: { system: "SAFEROUTE", direction: "in", status: "error", event: String(e), payload: payload as object } })
      .catch(() => {});
    return new Response("invalid webhook", { status: 400 });
  }
}
