// Импорт каталога из mysqldump старого сайта в нашу БД (Prisma/Postgres).
// Запуск:  node scripts/import-legacy.mjs <путь-к-.sql> [--dry]
//   --dry — только разбор и сводка, без записи в БД.
// Идемпотентно: очищает каталог (категории/товары/варианты/фото/движения)
// и заливает заново. Заказы/пользователи не трогает (варианты в заказах
// отвяжутся через SET NULL). Фото ожидаются в public/img/products (webp).

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const SQL = process.argv[2];
const DRY = process.argv.includes("--dry");
if (!SQL || !fs.existsSync(SQL)) { console.error("Укажите путь к .sql"); process.exit(1); }
const prisma = new PrismaClient();
const sql = fs.readFileSync(SQL, "utf8");
const PUB = path.resolve("public");

// ── разбор mysqldump ────────────────────────────────────────────────
function parseTuple(s) {
  const out = []; let i = 0, cur = "", inStr = false, val = null;
  while (i < s.length) {
    const c = s[i];
    if (inStr) { if (c === "\\") { cur += s[i + 1]; i += 2; continue; } if (c === "'") { inStr = false; val = cur; i++; continue; } cur += c; i++; continue; }
    if (c === "'") { inStr = true; cur = ""; i++; continue; }
    if (c === ",") { out.push(val); val = null; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    let j = i; while (j < s.length && s[j] !== ",") j++;
    const lit = s.slice(i, j).trim(); val = lit === "NULL" ? null : lit; i = j;
  }
  out.push(val); return out;
}
function extract(table) {
  const rows = []; const re = new RegExp("INSERT INTO `" + table + "` \\(([^)]+)\\) VALUES", "g"); let m;
  while ((m = re.exec(sql))) {
    const cols = m[1].split(",").map((c) => c.trim().replace(/`/g, ""));
    const end = sql.indexOf(";\n", re.lastIndex);
    const body = sql.slice(re.lastIndex, end === -1 ? undefined : end);
    let depth = 0, inStr = false, start = -1;
    for (let k = 0; k < body.length; k++) {
      const c = body[k];
      if (inStr) { if (c === "\\") { k++; continue; } if (c === "'") inStr = false; continue; }
      if (c === "'") { inStr = true; continue; }
      if (c === "(") { if (depth === 0) start = k + 1; depth++; }
      else if (c === ")") { depth--; if (depth === 0) { const t = parseTuple(body.slice(start, k)); const o = {}; cols.forEach((c2, i2) => (o[c2] = t[i2])); rows.push(o); } }
    }
  }
  return rows;
}

const cats = extract("categories").filter((c) => c.is_active === "1");
const prods = extract("products").filter((p) => !p.deleted_at);
const opts = extract("product_options").filter((o) => !o.deleted_at);
const imgs = extract("product_images");
const leaders = new Set(extract("leaders_of_sells").map((l) => l.product_id)); // хиты продаж

// «Новинки» — товары, созданные в последние 120 дней относительно самого свежего.
const times = prods.map((p) => (p.created_at ? Date.parse(p.created_at) : 0)).filter(Boolean);
const newestTs = times.length ? Math.max(...times) : 0;
const NEW_WINDOW = 120 * 24 * 3600 * 1000;
const isNewProd = (p) => p.created_at && newestTs - Date.parse(p.created_at) <= NEW_WINDOW;

// ── маппинг категорий (уникальные slug, дерево, path) ────────────────
const catById = Object.fromEntries(cats.map((c) => [c.id, c]));
const usedSlug = new Set();
const slugFor = (base) => { let s = base || "cat"; let n = 2; while (usedSlug.has(s)) s = `${base}-${n++}`; usedSlug.add(s); return s; };
// корни сначала, затем дети (для parent/path)
const ordered = [...cats.filter((c) => !c.parent_id), ...cats.filter((c) => c.parent_id)];
const catMap = {}; // oldId -> {slug, path}

// ── товары/варианты/фото ────────────────────────────────────────────
const num = (v) => (v == null ? null : Number(v));
const usedProductSlug = new Set();
const pSlug = (base) => { let s = base; let n = 2; while (usedProductSlug.has(s)) s = `${base}-${n++}`; usedProductSlug.add(s); return s; };
const usedSku = new Set();
const skuFor = (base) => { let s = base; let n = 2; while (usedSku.has(s)) s = `${base}-${n++}`; usedSku.add(s); return s; };

function imgUrl(p) {
  const webp = p.replace(/\.(png|jpe?g)$/i, ".webp");
  const abs = path.join(PUB, "img", webp);
  return fs.existsSync(abs) ? "/img/" + webp : null;
}

let vCount = 0, iCount = 0;
const plan = prods.map((p) => {
  const myOpts = opts.filter((o) => o.product_id === p.id);
  const variants = (myOpts.length ? myOpts : [null]).map((o, idx) => {
    const price = num(o?.discount_price) || num(o?.price) || num(p.discount_price) || num(p.price) || 0;
    const oldPrice = o && num(o.discount_price) && num(o.price) && num(o.price) > num(o.discount_price) ? num(o.price)
      : num(p.discount_price) && num(p.price) > num(p.discount_price) ? num(p.price) : null;
    const baseSku = (o?.article || p.article || p.slug || `p${p.id}`) + (myOpts.length > 1 ? `-${idx + 1}` : "");
    return { sku: skuFor(String(baseSku)), size: o?.size || null, color: o?.color || null, print: o?.print || null,
      price, oldPrice, stock: num(o?.count) || 0 };
  });
  vCount += variants.length;
  const pics = imgs.filter((i) => i.product_id === p.id)
    .map((i) => ({ url: imgUrl(i.path), alt: p.name, color: i.color || null, isMain: i.is_main === "1" }))
    .filter((x) => x.url)
    .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));
  iCount += pics.length;
  return { old: p, variants, pics };
});

console.log("Разобрано:", { категории: cats.length, товары: prods.length, варианты: vCount, фото: iCount });
console.log("Товаров без фото-файла:", plan.filter((x) => x.pics.length === 0).length);

if (DRY) {
  const ex = plan.find((x) => x.pics.length && x.variants.length);
  console.log("\nПример:", ex.old.name, "| вар:", ex.variants.length, "| фото:", ex.pics.length, "| первый url:", ex.pics[0].url);
  console.log("\n(dry-run — в БД ничего не записано)");
  await prisma.$disconnect(); process.exit(0);
}

// ── запись ──────────────────────────────────────────────────────────
console.log("\nОчистка старого каталога…");
await prisma.stockMovement.deleteMany();
await prisma.orderItem.deleteMany();
await prisma.order.deleteMany();
await prisma.productImage.deleteMany();
await prisma.productVariant.deleteMany();
await prisma.productRelation.deleteMany();
await prisma.product.deleteMany();
await prisma.category.deleteMany();

console.log("Категории…");
for (const [i, c] of ordered.entries()) {
  const slug = slugFor(c.slug || `cat-${c.id}`);
  const parent = c.parent_id ? catMap[c.parent_id] : null;
  const p = parent ? `${parent.path}/${slug}` : `/${slug}`;
  const created = await prisma.category.create({
    data: { slug, name: c.name, path: p, parentId: parent?.dbId ?? null, sortOrder: i, isActive: true },
  });
  catMap[c.id] = { slug, path: p, dbId: created.id };
}

console.log("Товары/варианты/фото…");
let done = 0;
for (const x of plan) {
  const cat = catMap[x.old.category_id];
  if (!cat) continue; // товар без валидной категории пропускаем
  await prisma.product.create({
    data: {
      slug: pSlug(x.old.slug || `p${x.old.id}`),
      name: x.old.name,
      description: x.old.description || null,
      basePrice: Math.min(...x.variants.map((v) => v.price)) || 0,
      isActive: true,
      isBestseller: leaders.has(x.old.id),
      isNew: isNewProd(x.old),
      publishedAt: x.old.created_at ? new Date(x.old.created_at) : new Date(),
      categoryId: cat.dbId,
      variants: { create: x.variants.map((v) => ({ sku: v.sku, size: v.size, color: v.color, print: v.print, price: v.price, oldPrice: v.oldPrice, stock: v.stock, reserved: 0, isActive: true })) },
      images: { create: x.pics.map((im, idx) => ({ url: im.url, alt: im.alt, sortOrder: idx })) },
    },
  });
  if (++done % 40 === 0) console.log("  …", done);
}

const counts = {
  категории: await prisma.category.count(),
  товары: await prisma.product.count(),
  варианты: await prisma.productVariant.count(),
  фото: await prisma.productImage.count(),
};
console.log("\nГотово:", counts);
await prisma.$disconnect();
