// Точка инициализации сервера (Next вызывает register() один раз при старте).
// Проверяем окружение и предупреждаем о ненастроенных интеграциях.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    try {
      validateEnv();
    } catch (e) {
      // В сборке (dummy DATABASE_URL) не роняем процесс — только предупреждаем.
      console.error("[instrumentation]", (e as Error).message);
    }
  }
}
