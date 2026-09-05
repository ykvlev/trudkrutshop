import { AdminApp, type AdminData } from "@/components/admin/admin-app";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fmt = (d: Date) =>
  new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const STATUS_RU: Record<string, string> = {
  NEW_PHYSICAL: "Новый (физ)", AWAITING_PAYMENT: "Ожидает оплаты", PAID_PHYSICAL: "Оплачен",
  NEW_LEGAL: "Новый (юр)", PAID_LEGAL: "Оплачен (юр)", SHIPPED: "Отправлен",
  COMPLETED: "Выполнен", CANCELLED: "Отменён", ARCHIVED: "Архив",
};
const REASON_RU: Record<string, string> = {
  ONLINE_SALE: "Продажа онлайн", OFFLINE_SALE: "Продажа офлайн (касса)", WRITE_OFF_GIFT: "Списание (подарок)",
  WRITE_OFF_DEFECT: "Списание (брак)", RETURN: "Возврат на склад", RECEIPT: "Приёмка",
  SYNC: "Синхронизация", MANUAL: "Корректировка",
};
const CERT_RU: Record<string, string> = {
  PENDING: "Ожидает отправки", ACTIVE: "Активен", PARTIALLY_USED: "Частично",
  USED: "Погашен", EXPIRED: "Истёк", CANCELLED: "Отменён",
};

export default async function AdminPage() {
  const [orders, products, movements, promos, certificates, categories, users, units] = await Promise.all([
    prisma.order.findMany({
      include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" }, take: 100,
    }),
    prisma.product.findMany({ include: { variants: true, category: true }, orderBy: { createdAt: "desc" } }),
    prisma.stockMovement.findMany({ include: { variant: true }, orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.certificate.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.category.findMany({ include: { parent: true }, orderBy: { sortOrder: "asc" } }),
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productVariant.aggregate({ _sum: { stock: true } }),
  ]);

  const data: AdminData = {
    stats: {
      orders: orders.length,
      awaiting: orders.filter((o) => o.status === "AWAITING_PAYMENT").length,
      products: products.length,
      units: units._sum.stock ?? 0,
    },
    orders: orders.map((o) => ({
      id: o.id, number: o.number, date: fmt(o.createdAt), customer: o.customerName,
      type: o.customerType === "LEGAL" ? "Юрлицо" : "Физлицо", total: Number(o.total), status: o.status,
      items: o.items.map((i) => ({ name: i.nameSnapshot, qty: i.quantity, price: Number(i.priceSnapshot) })),
      history: o.statusHistory.map((h) => ({
        at: fmt(h.createdAt),
        text: h.comment ?? `Статус → ${STATUS_RU[h.toStatus] ?? h.toStatus}`,
      })),
    })),
    products: products.map((p) => ({
      id: p.id, name: p.name, category: p.category.slug, sku: p.variants[0]?.sku ?? "—",
      price: Number(p.basePrice), stock: p.variants.reduce((s, v) => s + v.stock, 0), active: p.isActive,
    })),
    variants: products.flatMap((p) => p.variants.map((v) => ({ id: v.id, sku: v.sku, name: p.name }))),
    movements: movements.map((m) => ({
      date: fmt(m.createdAt), sku: m.variant.sku, reason: REASON_RU[m.reason] ?? m.reason, delta: m.delta,
    })),
    promos: promos.map((p) => ({
      id: p.id, code: p.code, type: p.type, value: Number(p.value),
      min: p.minAmount != null ? Number(p.minAmount) : null, limit: p.usageLimit, used: p.usedCount, active: p.isActive,
    })),
    certificates: certificates.map((c) => ({
      code: c.code, nominal: Number(c.nominal), balance: Number(c.balance), status: CERT_RU[c.status] ?? c.status,
    })),
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, parent: c.parent?.slug ?? null })),
    users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.isActive })),
  };

  return <AdminApp data={data} />;
}
