"use server";

// Серверные действия админки (запись в БД). Читает данные серверная страница
// admin/page.tsx; после мутации вызываем revalidatePath, чтобы страница
// перечитала свежие данные из Postgres.

import { revalidatePath } from "next/cache";
import { scryptSync, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { changeOrderStatusDb, recordStockMovementDb } from "@/lib/actions-db";
import type { OrderStatus, PromoType, StockReason, AdminRole } from "@prisma/client";

function refresh() {
  revalidatePath("/admin");
}

function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(plain, salt, 64).toString("hex")}`;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "product";

/** Смена статуса заказа (история + списание при отгрузке — в actions-db). */
export async function setOrderStatus(orderId: string, status: OrderStatus) {
  await changeOrderStatusDb(orderId, status);
  refresh();
}

/** Движение по складу (приёмка/списание/возврат) — через журнал. */
export async function addStockMovement(input: {
  variantId: string;
  delta: number;
  reason: StockReason;
  comment?: string;
}) {
  await recordStockMovementDb(input);
  refresh();
}

/** Создание/обновление товара. */
export async function upsertProduct(input: {
  id?: string;
  name: string;
  categorySlug: string;
  price: number;
  isActive: boolean;
}) {
  const cat = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
  if (!cat) throw new Error("Раздел не найден");
  if (input.id) {
    await prisma.product.update({
      where: { id: input.id },
      data: { name: input.name, categoryId: cat.id, basePrice: input.price, isActive: input.isActive },
    });
  } else {
    await prisma.product.create({
      data: {
        slug: `${slugify(input.name)}-${randomBytes(2).toString("hex")}`,
        name: input.name,
        categoryId: cat.id,
        basePrice: input.price,
        isActive: input.isActive,
        publishedAt: new Date(),
      },
    });
  }
  refresh();
}

/** Создание/обновление промокода. */
export async function upsertPromo(input: {
  code: string;
  type: PromoType;
  value: number;
  minAmount?: number | null;
  usageLimit?: number | null;
  isActive: boolean;
}) {
  await prisma.promoCode.upsert({
    where: { code: input.code },
    create: {
      code: input.code, type: input.type, value: input.value,
      minAmount: input.minAmount ?? null, usageLimit: input.usageLimit ?? null, isActive: input.isActive,
    },
    update: {
      type: input.type, value: input.value,
      minAmount: input.minAmount ?? null, usageLimit: input.usageLimit ?? null, isActive: input.isActive,
    },
  });
  refresh();
}

/** Создание/обновление сотрудника админки. */
export async function upsertAdminUser(input: {
  id?: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
}) {
  if (input.id) {
    await prisma.adminUser.update({
      where: { id: input.id },
      data: { name: input.name, email: input.email, role: input.role, isActive: input.isActive },
    });
  } else {
    await prisma.adminUser.create({
      data: {
        name: input.name, email: input.email, role: input.role, isActive: input.isActive,
        passwordHash: hashPassword("changeme"), // сотрудник меняет при первом входе
      },
    });
  }
  refresh();
}
