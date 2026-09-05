import { PrismaClient } from "@prisma/client";

// Единый экземпляр Prisma. В dev Next.js перезагружает модули при HMR —
// без кэша в globalThis появлялись бы десятки подключений к Postgres.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
