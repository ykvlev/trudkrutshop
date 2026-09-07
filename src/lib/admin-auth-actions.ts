"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";

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
