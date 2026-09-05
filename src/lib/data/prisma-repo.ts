// Prisma-реализация слоя данных. Пока НЕ подключена: активируется заменой
// импорта в lib/data/index.ts на "./prisma-repo" — после того как БД поднята
// (npm install → npm run db:migrate → npm run db:seed).
//
// Сигнатуры совпадают с test-data-source.ts. Здесь схема Prisma маппится в
// ту же view-модель (Product/Category из lib/test-data), поэтому страницы
// витрины и их пропсы не меняются.

import { prisma } from "@/lib/prisma";
import type { Category, Product, Variant } from "@/lib/test-data";
import type {
  Category as DbCategory,
  Product as DbProduct,
  ProductVariant as DbVariant,
} from "@prisma/client";

// ── Мапперы БД → view-модель ─────────────────────────────────────
function mapCategory(c: DbCategory & { parent?: DbCategory | null }): Category {
  return {
    slug: c.slug,
    name: c.name,
    parent: c.parent?.slug,
    seoText: c.seoText ?? undefined,
  };
}

function mapVariant(v: DbVariant): Variant {
  return {
    sku: v.sku,
    size: v.size ?? undefined,
    color: v.color ?? undefined,
    print: v.print ?? undefined,
    stock: v.stock,
  };
}

function mapProduct(
  p: DbProduct & { variants: DbVariant[]; category: DbCategory },
): Product {
  const variants = p.variants.map(mapVariant);
  const distinct = (xs: (string | undefined)[]) => [...new Set(xs.filter(Boolean) as string[])];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category.slug,
    price: Number(p.basePrice),
    oldPrice: p.oldPrice != null ? Number(p.oldPrice) : undefined,
    isNew: p.isNew,
    isBestseller: p.isBestseller,
    variants,
    sizes: distinct(variants.map((v) => v.size)),
    colors: distinct(variants.map((v) => v.color)),
  };
}

const productInclude = { variants: true, category: true } as const;

// ── Категории ────────────────────────────────────────────────────
export async function getTopCategories(): Promise<Category[]> {
  const cats = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return cats.map((c) => mapCategory(c));
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const c = await prisma.category.findUnique({ where: { slug }, include: { parent: true } });
  return c ? mapCategory(c) : undefined;
}

export async function getBreadcrumb(slug: string): Promise<Category[]> {
  const trail: Category[] = [];
  let cur = await prisma.category.findUnique({ where: { slug }, include: { parent: true } });
  while (cur) {
    trail.unshift(mapCategory(cur));
    cur = cur.parentId
      ? await prisma.category.findUnique({ where: { id: cur.parentId }, include: { parent: true } })
      : null;
  }
  return trail;
}

export async function isLeafCategory(slug: string): Promise<boolean> {
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return true;
  const kids = await prisma.category.count({ where: { parentId: cat.id } });
  return kids === 0;
}

export async function getChildren(slug: string): Promise<Category[]> {
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return [];
  const kids = await prisma.category.findMany({
    where: { parentId: cat.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return kids.map((c) => mapCategory(c));
}

// Все товары поддерева — по материализованному пути (path startsWith).
export async function getCategoryProducts(slug: string): Promise<Product[]> {
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return [];
  const subtree = await prisma.category.findMany({ where: { path: { startsWith: cat.path } } });
  const ids = subtree.map((c) => c.id);
  const prods = await prisma.product.findMany({
    where: { categoryId: { in: ids }, isActive: true },
    include: productInclude,
    orderBy: { publishedAt: "desc" },
  });
  return prods.map(mapProduct);
}

// ── Товары ───────────────────────────────────────────────────────
export async function getProduct(slug: string): Promise<Product | undefined> {
  const p = await prisma.product.findUnique({ where: { slug }, include: productInclude });
  return p ? mapProduct(p) : undefined;
}

export async function getSimilar(p: Product, limit = 8): Promise<Product[]> {
  const cat = await prisma.category.findUnique({ where: { slug: p.category } });
  if (!cat) return [];
  const prods = await prisma.product.findMany({
    where: { categoryId: cat.id, isActive: true, slug: { not: p.slug } },
    include: productInclude,
    take: limit,
  });
  return prods.map(mapProduct);
}

export async function getBoughtWith(p: Product, limit = 8): Promise<Product[]> {
  const cat = await prisma.category.findUnique({ where: { slug: p.category } });
  const prods = await prisma.product.findMany({
    where: { isActive: true, slug: { not: p.slug }, ...(cat ? { categoryId: { not: cat.id } } : {}) },
    include: productInclude,
    take: limit,
  });
  return prods.map(mapProduct);
}

export async function getAllProducts(): Promise<Product[]> {
  const prods = await prisma.product.findMany({ where: { isActive: true }, include: productInclude });
  return prods.map(mapProduct);
}

export async function getBestsellers(limit = 4): Promise<Product[]> {
  const prods = await prisma.product.findMany({
    where: { isActive: true, isBestseller: true },
    include: productInclude,
    take: limit,
  });
  return prods.map(mapProduct);
}

export async function getNew(limit = 4): Promise<Product[]> {
  const prods = await prisma.product.findMany({
    where: { isActive: true, isNew: true },
    include: productInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return prods.map(mapProduct);
}
