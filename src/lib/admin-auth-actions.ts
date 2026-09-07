"use server";

import { redirect } from "next/navigation";
import { scryptSync, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie, clearSessionCookie, getAdmin } from "@/lib/auth";

function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(plain, salt, 64).toString("hex")}`;
}

export type LoginState = { error?: string };

/** Вход в админку по email + паролю (useActionState). */
export async function loginAdmin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Введите email и пароль" };

  const user = await prisma.adminUser.findUnique({ where: { email } });
  // Одинаковое сообщение, чтобы не раскрывать существование учётки.
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return { error: "Неверный email или пароль" };
  }

  await setSessionCookie(user.id);
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearSessionCookie();
  redirect("/admin/login");
}

export type PasswordState = { error?: string; ok?: boolean };

/** Смена собственного пароля (текущий → новый). */
export async function changeOwnPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const admin = await getAdmin();
  if (!admin) return { error: "Сессия истекла, войдите заново" };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: "Новый пароль — минимум 8 символов" };

  const user = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!user || !verifyPassword(current, user.passwordHash)) {
    return { error: "Текущий пароль неверный" };
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: hashPassword(next) } });
  return { ok: true };
}
