// Мок-реализация слоя данных на статических тестовых данных (lib/test-data).
// Не требует БД — используется для локального просмотра фронтенда/дизайна.
// Активируется переменной окружения DATA_SOURCE=mock (см. lib/data/index.ts).
// Сигнатуры повторяют prisma-repo.ts, поэтому страницы витрины не меняются.

import type { Category, Product } from "@/lib/test-data";
import {
  categories,
  products,
  getCategory as _getCategory,
  childrenOf,
  isLeaf,
  productsInCategory,
  breadcrumbTrail,
  getProduct as _getProduct,
  similarTo,
  boughtWith,
} from "@/lib/test-data";

// ── Категории ────────────────────────────────────────────────────
export async function getTopCategories(): Promise<Category[]> {
  return categories.filter((c) => !c.parent);
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return _getCategory(slug);
}

export async function getBreadcrumb(slug: string): Promise<Category[]> {
  return breadcrumbTrail(slug);
}

export async function isLeafCategory(slug: string): Promise<boolean> {
  return isLeaf(slug);
}

export async function getChildren(slug: string): Promise<Category[]> {
  return childrenOf(slug);
}

export async function getCategoryTree(): Promise<
  { slug: string; name: string; children: { slug: string; name: string }[] }[]
> {
  const roots = categories.filter((c) => !c.parent);
  return roots.map((r) => ({
    slug: r.slug,
    name: r.name,
    children: categories
      .filter((c) => c.parent === r.slug)
      .map((c) => ({ slug: c.slug, name: c.name })),
  }));
}

export async function getCategoryProducts(slug: string): Promise<Product[]> {
  return productsInCategory(slug);
}

// ── Товары ───────────────────────────────────────────────────────
export async function getProduct(slug: string): Promise<Product | undefined> {
  return _getProduct(slug);
}

export async function getSimilar(p: Product, limit = 8): Promise<Product[]> {
  return similarTo(p, limit);
}

export async function getBoughtWith(p: Product, limit = 8): Promise<Product[]> {
  return boughtWith(p, limit);
}

export async function searchProducts(q: string): Promise<Product[]> {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description?.toLowerCase().includes(term) ?? false) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(term)),
    )
    .slice(0, 40);
}

export async function getAllProducts(): Promise<Product[]> {
  return products;
}

export async function getBestsellers(limit = 4): Promise<Product[]> {
  return products.filter((p) => p.isBestseller).slice(0, limit);
}

export async function getNew(limit = 4): Promise<Product[]> {
  return products.filter((p) => p.isNew).slice(0, limit);
}
