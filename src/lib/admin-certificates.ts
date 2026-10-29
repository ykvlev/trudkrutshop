import type { Prisma } from "@prisma/client";

const STATUS_RU: Record<string, string> = {
  PENDING: "Ожидает отправки", ACTIVE: "Активен", PARTIALLY_USED: "Частично использован",
  USED: "Погашен", EXPIRED: "Истёк", CANCELLED: "Отменён",
};

export function adminCertificate(c: Prisma.CertificateGetPayload<{ include: { design: true } }>) {
  return {
    code: c.code, name: c.design?.name ?? "Подарочный сертификат",
    nominal: Number(c.nominal), balance: Number(c.balance), status: STATUS_RU[c.status] ?? c.status,
  };
}
