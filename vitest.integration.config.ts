import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

// Интеграционные тесты (*.itest.ts) на отдельной БД tksh_test.
// Запуск: npm run test:integration (нужна поднятая БД со схемой: prisma db push).
export default defineConfig(({ mode }) => ({
  test: {
    environment: "node",
    include: ["src/**/*.itest.ts"],
    fileParallelism: false,
    env: loadEnv(mode, process.cwd(), ""),
  },
}));
