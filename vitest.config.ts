import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Юнит-тесты доменной логики; интеграционные (БД) добавим отдельным проектом.
    include: ["src/**/*.test.ts"],
  },
});
