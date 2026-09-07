// Права доступа админки по роли. Общий модуль (сервер + клиент): сервер
// проверяет в действиях, клиент прячет недоступные разделы.

import type { AdminRole } from "@prisma/client";

export type Perm =
  | "orders"
  | "stock"
  | "products"
  | "promo"
  | "certificates"
  | "categories"
  | "users";

const ALL: Perm[] = ["orders", "stock", "products", "promo", "certificates", "categories", "users"];

// ADMIN — всё; MANAGER — продажи и склад; CONTENT — каталог и контент.
export const ROLE_PERMS: Record<AdminRole, Perm[]> = {
  ADMIN: ALL,
  MANAGER: ["orders", "stock", "promo", "certificates"],
  CONTENT: ["products", "categories"],
};

export function can(role: AdminRole, perm: Perm): boolean {
  return ROLE_PERMS[role]?.includes(perm) ?? false;
}
