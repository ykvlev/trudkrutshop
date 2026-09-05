import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";
import { categories, products } from "../src/lib/test-data";

const prisma = new PrismaClient();

function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Сидирование tksh_dev…");

  // Полная очистка (идемпотентный сид для разработки).
  await prisma.stockMovement.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.page.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.certificateDesign.deleteMany();

  // ── Категории: сначала корневые, потом дети (для parentId и path) ──
  const bySlug = new Map<string, { id: string; path: string }>();
  const roots = categories.filter((c) => !c.parent);
  const children = categories.filter((c) => c.parent);

  for (const [i, c] of roots.entries()) {
    const created = await prisma.category.create({
      data: {
        slug: c.slug,
        name: c.name,
        seoText: c.seoText,
        path: `/${c.slug}`,
        sortOrder: i,
      },
    });
    bySlug.set(c.slug, { id: created.id, path: created.path });
  }
  for (const [i, c] of children.entries()) {
    const parent = bySlug.get(c.parent!);
    if (!parent) continue;
    const created = await prisma.category.create({
      data: {
        slug: c.slug,
        name: c.name,
        seoText: c.seoText,
        parentId: parent.id,
        path: `${parent.path}/${c.slug}`,
        sortOrder: i,
      },
    });
    bySlug.set(c.slug, { id: created.id, path: created.path });
  }

  // ── Товары + варианты + начальный остаток через движение RECEIPT ──
  for (const p of products) {
    const cat = bySlug.get(p.category);
    if (!cat) continue;

    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        categoryId: cat.id,
        basePrice: p.price,
        oldPrice: p.oldPrice,
        isNew: p.isNew ?? false,
        isBestseller: p.isBestseller ?? false,
        publishedAt: new Date(),
      },
    });

    for (const v of p.variants) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          print: v.print,
          price: p.price,
          oldPrice: p.oldPrice,
          stock: v.stock, // баланс
        },
      });
      // Журнал: приёмка на тот же остаток — баланс сходится с движениями.
      if (v.stock > 0) {
        await prisma.stockMovement.create({
          data: {
            variantId: variant.id,
            delta: v.stock,
            reason: "RECEIPT",
            comment: "Начальная приёмка (сид)",
          },
        });
      }
    }
  }

  // ── Админ ──
  await prisma.adminUser.create({
    data: {
      email: "admin@trudkrutshop.ru",
      name: "Администратор",
      passwordHash: hashPassword("admin12345"),
      role: "ADMIN",
    },
  });

  // ── Статические страницы ──
  const pages = [
    { slug: "delivery", title: "Доставка", content: "Условия доставки уточняются." },
    { slug: "payment", title: "Оплата", content: "Способы оплаты уточняются." },
    { slug: "about", title: "О магазине", content: "Магазин отрядного мерча РСО." },
    { slug: "contacts", title: "Контакты", content: "Москва, Лефортовский пер., 8 стр. 1." },
  ];
  for (const pg of pages) {
    await prisma.page.create({ data: pg });
  }

  // ── Дизайн сертификата + баннер ──
  await prisma.certificateDesign.create({
    data: { name: "Классический", codeX: 480, codeY: 620 },
  });
  await prisma.banner.create({
    data: {
      title: "#ТрудКрут, а ты ещё круче",
      imageDesktop: "/banners/hero-desktop.jpg",
      imageMobile: "/banners/hero-mobile.jpg",
      href: "/catalog/futbolki",
      sortOrder: 0,
    },
  });

  const counts = {
    категорий: await prisma.category.count(),
    товаров: await prisma.product.count(),
    вариантов: await prisma.productVariant.count(),
    движений: await prisma.stockMovement.count(),
  };
  console.log("Готово:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
