import { prisma } from "@/lib/prisma";
import { buildInvoicePdf } from "@/lib/invoice/pdf";

export const dynamic = "force-dynamic";

// Счёт на оплату (PDF) для заказа юрлица. Идемпотентно создаёт запись Invoice
// при первом обращении, далее переиспользует её номер и дату.
export async function GET(_req: Request, ctx: RouteContext<"/api/invoice/[number]">) {
  const { number } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true, legalEntity: true, invoices: true },
  });

  if (!order) return new Response("Заказ не найден", { status: 404 });
  if (order.customerType !== "LEGAL" || !order.legalEntity) {
    return new Response("Счёт доступен только для заказов юрлиц", { status: 400 });
  }

  // Номер и дата счёта — из существующей записи либо создаём новую.
  let invoice = order.invoices[0];
  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: { number: `СЧ-${order.number}`, amount: order.total, orderId: order.id },
    });
  }

  const pdf = await buildInvoicePdf({
    invoiceNumber: invoice.number,
    invoiceDate: invoice.date,
    buyer: {
      name: order.legalEntity.name,
      inn: order.legalEntity.inn,
      kpp: order.legalEntity.kpp,
      legalAddress: order.legalEntity.legalAddress,
    },
    lines: order.items.map((i) => ({
      name: i.nameSnapshot,
      quantity: i.quantity,
      price: Number(i.priceSnapshot),
    })),
    deliveryCost: Number(order.deliveryCost),
  });

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
