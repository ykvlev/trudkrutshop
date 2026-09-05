// Реализация слоя данных на тестовых данных. Совпадает по сигнатурам с
// prisma-repo.ts — переключение источника не требует правок страниц.

import * as td from "@/lib/test-data";
import type { Category, Product } from "@/lib/test-data";

export async function getTopCategories(): Promise<Category[]> {
  return td.topCategories;
}
export async function getCategory(slug: string): Promise<Category | undefined> {
  return td.getCategory(slug);
}
export async function getBreadcrumb(slug: string): Promise<Category[]> {
  return td.breadcrumbTrail(slug);
}
export async function isLeafCategory(slug: string): Promise<boolean> {
  return td.isLeaf(slug);
}
export async function getChildren(slug: string): Promise<Category[]> {
  return td.childrenOf(slug);
}
export async function getCategoryProducts(slug: string): Promise<Product[]> {
  return td.productsInCategory(slug);
}
export async function getProduct(slug: string): Promise<Product | undefined> {
  return td.getProduct(slug);
}
export async function getSimilar(p: Product): Promise<Product[]> {
  return td.similarTo(p);
}
export async function getBoughtWith(p: Product): Promise<Product[]> {
  return td.boughtWith(p);
}
export async function searchProducts(q: string): Promise<Product[]> {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return td.products.filter(
    (p) =>
      p.name.toLowerCase().includes(t) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(t)),
  );
}

export async function getAllProducts(): Promise<Product[]> {
  return td.products;
}
export async function getBestsellers(limit = 4): Promise<Product[]> {
  return td.products.filter((p) => p.isBestseller).slice(0, limit);
}
export async function getNew(limit = 4): Promise<Product[]> {
  return td.products.filter((p) => p.isNew).slice(0, limit);
}
