"use server";

import { prisma } from "@/lib/prisma";
import { requirePerm } from "@/lib/auth";
import { adminCertificate } from "@/lib/admin-certificates";

export type CertificateSearchState = {
  items: ReturnType<typeof adminCertificate>[];
  total?: number;
  error?: string;
};

export async function searchAdminCertificates(
  previous: CertificateSearchState, formData: FormData,
): Promise<CertificateSearchState> {
  await requirePerm("certificates");
  const query = String(formData.get("query") ?? "").trim().slice(0, 200);
  const where = query ? {
    OR: [
      { code: { contains: query, mode: "insensitive" as const } },
      { design: { is: { name: { contains: query, mode: "insensitive" as const } } } },
      ...("подарочный сертификат".includes(query.toLocaleLowerCase("ru-RU")) ? [{ designId: null }] : []),
    ],
  } : {};
  try {
    const [items, total] = await Promise.all([
      prisma.certificate.findMany({ where, include: { design: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100 }),
      prisma.certificate.count({ where }),
    ]);
    return { items: items.map(adminCertificate), total };
  } catch {
    return { ...previous, error: "Не удалось выполнить поиск. Попробуйте ещё раз." };
  }
}
