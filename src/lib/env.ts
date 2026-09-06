// Валидация переменных окружения (zod). Задача — рано и понятно падать при
// отсутствии критичных переменных и предупреждать о ненастроенных интеграциях.
//
// Критичные (throw): DATABASE_URL.
// Опциональные интеграции (warn): при пустом ключе используется mock-провайдер.

import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL должен быть валидным postgres URL"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Интеграции — опциональны (пусто → mock).
  TOCHKA_API_KEY: z.string().optional(),
  SAFEROUTE_API_KEY: z.string().optional(),
  DIADOC_API_KEY: z.string().optional(),
  DADATA_TOKEN: z.string().optional(),

  JOBS_DISABLED: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

/** Валидирует process.env. Возвращает результат разбора (не бросает). */
export function parseEnv() {
  return schema.safeParse(process.env);
}

const INTEGRATIONS: [keyof Env, string][] = [
  ["TOCHKA_API_KEY", "оплата/касса (Точка)"],
  ["SAFEROUTE_API_KEY", "доставка (SafeRoute)"],
  ["DIADOC_API_KEY", "ЭДО/УПД (Диадок)"],
  ["DADATA_TOKEN", "реквизиты по ИНН (DaData)"],
];

/**
 * Стартовая проверка окружения. Бросает при критичных ошибках,
 * пишет предупреждения о ненастроенных интеграциях. Вызывается из
 * instrumentation.register() и воркера.
 */
export function validateEnv(): Env {
  const parsed = parseEnv();
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Некорректное окружение:\n${issues}`);
  }
  const env = parsed.data;
  const missing = INTEGRATIONS.filter(([key]) => !env[key]).map(([, label]) => label);
  if (missing.length) {
    console.warn(`[env] интеграции в mock-режиме (ключи не заданы): ${missing.join(", ")}`);
  }
  return env;
}
