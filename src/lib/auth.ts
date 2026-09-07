// Аутентификация админки. Сессия — подписанный HMAC-токен в HttpOnly-cookie.
// Пароли — scrypt (формат "salt:hash", как в prisma/seed.ts). Без внешних
// зависимостей; secret — из ENV AUTH_SECRET (в проде обязателен).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "tksh_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET не задан (обязателен в проде)");
  }
  return "dev-insecure-secret-change-me"; // только для локальной разработки
}

/** Проверка пароля против сохранённого scrypt-хэша "salt:hash". */
export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(plain, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const b64url = (b: Buffer) => b.toString("base64url");

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Подписанный токен сессии для пользователя. */
export function createSessionToken(userId: string): string {
  const body = b64url(Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })));
  return `${body}.${sign(body)}`;
}

function verifySessionToken(token: string): string | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof data.uid !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

/** Установить cookie сессии (только в server action / route handler). */
export async function setSessionCookie(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Текущий админ по cookie (или null). Проверяет подпись, срок и активность. */
export async function getAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const uid = verifySessionToken(token);
  if (!uid) return null;
  const user = await prisma.adminUser.findUnique({ where: { id: uid } });
  if (!user || !user.isActive) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** Требовать авторизации: иначе редирект на страницу входа. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
