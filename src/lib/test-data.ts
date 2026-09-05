// Тестовые данные витрины (каркас). Позже заменяются выборками из Postgres/Prisma.
// Названия и цены — с живого trudkrutshop.ru, чтобы каркас читался реалистично.

export type Variant = {
  sku: string;
  size?: string;
  color?: string;
  print?: string;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** slug конечной категории */
  category: string;
  price: number;
  oldPrice?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  /** есть ли хоть один вариант в наличии — считается из variants */
  variants: Variant[];
  sizes?: string[];
  colors?: string[];
};

export type Category = {
  slug: string;
  name: string;
  parent?: string;
  /** SEO-текст над сеткой конечной категории */
  seoText?: string;
};

export const categories: Category[] = [
  { slug: "futbolki", name: "Футболки", seoText:
    "Футболки Российских Студенческих Отрядов: отрядная символика, плотный хлопок, прямой крой. Размеры от XS до XXL." },
  { slug: "hudi", name: "Худи", seoText:
    "Тёплые худи с начёсом и вышивкой РСО. Унисекс-посадка, размеры от XS до XXL." },
  { slug: "znachki", name: "Значки" },
  { slug: "kirpichi", name: "Кирпичи", parent: "znachki", seoText:
    "Коллекционные значки-кирпичи РСО по годам. Металл, мягкая эмаль, цанговое крепление." },
  { slug: "piny", name: "Пины", parent: "znachki", seoText:
    "Пины с отрядными фразами и символикой. Металл, твёрдая эмаль." },
  { slug: "derevyannye", name: "Деревянные значки", parent: "znachki", seoText:
    "Деревянные значки с лазерной гравировкой. Берёзовая фанера, булавка." },
  { slug: "aksessuary", name: "Аксессуары" },
  { slug: "noski", name: "Носки", parent: "aksessuary", seoText:
    "Носки ТрудКрут с жаккардовым узором. Хлопок, безразмерные и по размерам." },
  { slug: "shopery", name: "Шоперы", parent: "aksessuary", seoText:
    "Шоперы из плотного хлопка с принтами РСО." },
];

export const products: Product[] = [
  {
    id: "p-hudi-rso-grey", slug: "hudi-rso-grey", name: "Худи «РСО» серый, начёс",
    category: "hudi", price: 3450, isBestseller: true,
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Серый", "Чёрный"],
    variants: [
      { sku: "HD-RSO-GR-S", size: "S", color: "Серый", stock: 4 },
      { sku: "HD-RSO-GR-M", size: "M", color: "Серый", stock: 7 },
      { sku: "HD-RSO-GR-L", size: "L", color: "Серый", stock: 2 },
      { sku: "HD-RSO-BK-M", size: "M", color: "Чёрный", stock: 5 },
    ],
  },
  {
    id: "p-hudi-trudkrut", slug: "hudi-trudkrut-blue", name: "Худи «ТрудКрут» синий",
    category: "hudi", price: 3650, oldPrice: 3990, isNew: true,
    sizes: ["S", "M", "L", "XL"], colors: ["Синий"],
    variants: [
      { sku: "HD-TK-BL-S", size: "S", color: "Синий", stock: 3 },
      { sku: "HD-TK-BL-M", size: "M", color: "Синий", stock: 6 },
      { sku: "HD-TK-BL-L", size: "L", color: "Синий", stock: 0 },
    ],
  },
  {
    id: "p-fb-rso-white", slug: "futbolka-rso-white", name: "Футболка «РСО» белая",
    category: "futbolki", price: 1290, isBestseller: true,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"], colors: ["Белый"],
    variants: [
      { sku: "FB-RSO-WH-S", size: "S", color: "Белый", stock: 12 },
      { sku: "FB-RSO-WH-M", size: "M", color: "Белый", stock: 9 },
      { sku: "FB-RSO-WH-L", size: "L", color: "Белый", stock: 8 },
    ],
  },
  {
    id: "p-fb-trudkrut", slug: "futbolka-trudkrut", name: "Футболка «#ТрудКрут»",
    category: "futbolki", price: 1390, oldPrice: 1590, isNew: true,
    sizes: ["S", "M", "L", "XL"], colors: ["Чёрный", "Синий"],
    variants: [
      { sku: "FB-TK-BK-M", size: "M", color: "Чёрный", stock: 10 },
      { sku: "FB-TK-BK-L", size: "L", color: "Чёрный", stock: 4 },
      { sku: "FB-TK-BL-M", size: "M", color: "Синий", stock: 6 },
    ],
  },
  {
    id: "p-pin-trudkrut", slug: "pin-trudkrut", name: "Пин «ТрудКрут»",
    category: "piny", price: 250, isBestseller: true,
    variants: [{ sku: "PN-TK", stock: 40 }],
  },
  {
    id: "p-pin-gori", slug: "pin-gori-svoim-delom", name: "Пин «Гори своим делом»",
    category: "piny", price: 250, isNew: true,
    variants: [{ sku: "PN-GORI", stock: 25 }],
  },
  {
    id: "p-pin-brat", slug: "pin-brat-i-delat", name: "Пин «Брать и делать»",
    category: "piny", price: 250,
    variants: [{ sku: "PN-BRAT", stock: 0 }],
  },
  {
    id: "p-kirpich-2021", slug: "kirpich-2021", name: "Кирпич 2021",
    category: "kirpichi", price: 200,
    variants: [{ sku: "KR-2021", stock: 15 }],
  },
  {
    id: "p-kirpich-2023", slug: "kirpich-2023-silver", name: "Кирпич 2023 серебро",
    category: "kirpichi", price: 200, isBestseller: true,
    variants: [{ sku: "KR-2023-S", stock: 18 }],
  },
  {
    id: "p-kirpich-2024", slug: "kirpich-2024", name: "Кирпич 2024",
    category: "kirpichi", price: 220, isNew: true,
    variants: [{ sku: "KR-2024", stock: 30 }],
  },
  {
    id: "p-znachok-17feb", slug: "znachok-17-fevralya", name: "Значок «17 февраля — день РСО»",
    category: "piny", price: 250,
    variants: [{ sku: "ZN-17FEB", stock: 22 }],
  },
  {
    id: "p-derevo-otryad", slug: "derevyannyy-znachok-otryad", name: "Деревянный значок «Отряд»",
    category: "derevyannye", price: 180, isNew: true,
    variants: [{ sku: "DV-OTR", stock: 14 }],
  },
  {
    id: "p-noski-trudkrut", slug: "noski-trudkrut-black", name: "Носки «ТрудКрут» чёрные",
    category: "noski", price: 390,
    sizes: ["36-40", "41-45"],
    variants: [
      { sku: "NS-TK-BK-S", size: "36-40", color: "Чёрный", stock: 20 },
      { sku: "NS-TK-BK-L", size: "41-45", color: "Чёрный", stock: 0 },
    ],
  },
  {
    id: "p-shoper-rso", slug: "shoper-rso", name: "Шопер «РСО»",
    category: "shopery", price: 690, oldPrice: 890,
    variants: [{ sku: "SH-RSO", stock: 8 }],
  },
  {
    id: "p-fb-otryad", slug: "futbolka-moy-otryad", name: "Футболка «Мой отряд»",
    category: "futbolki", price: 1290,
    sizes: ["S", "M", "L"], colors: ["Синий"],
    variants: [
      { sku: "FB-OTR-BL-S", size: "S", color: "Синий", stock: 5 },
      { sku: "FB-OTR-BL-M", size: "M", color: "Синий", stock: 0 },
    ],
  },
  {
    id: "p-pin-set", slug: "pin-nabor-3", name: "Набор пинов (3 шт.)",
    category: "piny", price: 650, oldPrice: 750, isBestseller: true,
    variants: [{ sku: "PN-SET3", stock: 11 }],
  },
];

// ── Производные хелперы ─────────────────────────────────────────────

export function inStock(p: Product): boolean {
  return p.variants.some((v) => v.stock > 0);
}

export function totalStock(p: Product): number {
  return p.variants.reduce((s, v) => s + v.stock, 0);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function childrenOf(slug?: string): Category[] {
  return categories.filter((c) => c.parent === slug);
}

export function isLeaf(slug: string): boolean {
  return childrenOf(slug).length === 0;
}

/** Все конечные подкатегории данной категории (для сбора товаров раздела). */
function leafDescendants(slug: string): string[] {
  if (isLeaf(slug)) return [slug];
  return childrenOf(slug).flatMap((c) => leafDescendants(c.slug));
}

export function productsInCategory(slug: string): Product[] {
  const leaves = new Set(leafDescendants(slug));
  return products.filter((p) => leaves.has(p.category));
}

/** Хлебные крошки от корня до категории. */
export function breadcrumbTrail(slug: string): Category[] {
  const trail: Category[] = [];
  let cur = getCategory(slug);
  while (cur) {
    trail.unshift(cur);
    cur = cur.parent ? getCategory(cur.parent) : undefined;
  }
  return trail;
}

/** Верхнеуровневые разделы для меню/шапки. */
export const topCategories = categories.filter((c) => !c.parent);

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/** «Похожие товары» — из того же раздела, кроме самого товара. */
export function similarTo(p: Product, limit = 8): Product[] {
  return products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, limit);
}

/** «С этим покупают» — заглушка автоподбора: товары из других разделов. */
export function boughtWith(p: Product, limit = 8): Product[] {
  return products.filter((x) => x.category !== p.category).slice(0, limit);
}
