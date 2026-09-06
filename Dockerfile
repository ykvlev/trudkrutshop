# syntax=docker/dockerfile:1

# ТрудКрутШоп — многостадийная сборка Next.js (standalone) + Prisma.
# Итоговый образ не содержит node_modules и dev-зависимостей.

# ── deps: установка зависимостей ───────────────────────────────────────
FROM node:20-alpine AS deps
# Prisma на alpine требует openssl и совместимость с glibc.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
# Если lock-файла нет — install, иначе воспроизводимая установка.
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

# ── builder: генерация Prisma Client и сборка Next ─────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL нужен только как валидная строка на этапе сборки (БД не читается).
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npx next typegen
RUN npm run build

# ── runner: минимальный образ для продакшена ───────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Непривилегированный пользователь.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Схема Prisma и сгенерированный клиент нужны воркеру и миграциям в рантайме.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Standalone-сервер + статика.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# ── worker: фоновые задачи (pg-boss) через tsx ─────────────────────────
# Отдельный образ: воркеру нужны исходники TS и tsx, поэтому наследуем builder.
FROM builder AS worker
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["npm", "run", "worker"]
