import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { staticSlugs } from "@/lib/pages";

// Карта сайта из БД: категории, товары, статические страницы.
export const dynamic = "force-dynamic";

const BASE = "https://trudkrutshop.ru";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/certificates`, changeFrequency: "monthly", priority: 0.6 },
    ...staticSlugs.map((s) => ({
      url: `${BASE}/${s}`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
    ...categories.map((c) => ({
      url: `${BASE}/catalog/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${BASE}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
