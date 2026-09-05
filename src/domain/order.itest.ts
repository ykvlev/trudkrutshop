import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { available, recordMovement, release, reserve, shipReservation } from "./stock";

// Интеграционные тесты складского контура на реальной БД (tksh_test).
const url = process.env.TEST_DATABASE_URL;
const prisma = new PrismaClient({ datasourceUrl: url });

const CAT = "itest-cat";
const SLUG = "itest-product";
let variantId = "";

describe("складской контур (БД)", () => {
  beforeAll(async () => {
    await cleanup();
    const category = await prisma.category.create({ data: { slug: CAT, name: "IT-раздел", path: `/${CAT}` } });
    const product = await prisma.product.create({
      data: { slug: SLUG, name: "IT-товар", categoryId: category.id, basePrice: 100 },
    });
    const v = await prisma.productVariant.create({
      data: { productId: product.id, sku: "ITEST-SKU", stock: 10, reserved: 0, price: 100 },
    });
    variantId = v.id;
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("бронь уменьшает доступное, но не остаток", async () => {
    await prisma.$transaction((tx) => reserve(tx, variantId, 3));
    const v = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(v.stock).toBe(10);
    expect(v.reserved).toBe(3);
    expect(available(v)).toBe(7);
  });

  it("нельзя забронировать больше доступного", async () => {
    await expect(prisma.$transaction((tx) => reserve(tx, variantId, 100))).rejects.toThrow();
  });

  it("отгрузка списывает остаток и снимает бронь через журнал", async () => {
    await prisma.$transaction((tx) =>
      shipReservation(tx, { variantId, qty: 3, orderId: undefined as unknown as string }),
    );
    const v = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(v.stock).toBe(7);
    expect(v.reserved).toBe(0);
    const moves = await prisma.stockMovement.findMany({ where: { variantId } });
    expect(moves.some((m) => m.delta === -3 && m.reason === "ONLINE_SALE")).toBe(true);
  });

  it("приёмка увеличивает остаток", async () => {
    await prisma.$transaction((tx) =>
      recordMovement(tx, { variantId, delta: 5, reason: "RECEIPT" }),
    );
    const v = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(v.stock).toBe(12);
  });

  it("release не уводит бронь в минус", async () => {
    await prisma.$transaction((tx) => release(tx, variantId, 999));
    const v = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(v.reserved).toBe(0);
  });
});

async function cleanup() {
  const product = await prisma.product.findUnique({ where: { slug: SLUG }, include: { variants: true } });
  if (product) {
    await prisma.stockMovement.deleteMany({ where: { variantId: { in: product.variants.map((v) => v.id) } } });
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
  }
  await prisma.category.deleteMany({ where: { slug: CAT } });
}
