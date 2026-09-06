// Фасад постановки задач. Использует pg-boss поверх той же Postgres, когда
// задан DATABASE_URL; иначе (или при JOBS_DISABLED=1) — лог-заглушка.
//
// Постановка задачи НИКОГДА не валит вызывающий код (оформление заказа и т.п.):
// при ошибке очереди пишем предупреждение и продолжаем. Обработчики — worker.ts.

import type { JobName, JobPayloads, JobQueue } from "./types";
import { pgBossQueue } from "./queue-pgboss";

class NoopQueue implements JobQueue {
  async enqueue<N extends JobName>(name: N, _data: JobPayloads[N]): Promise<void> {
    console.info(`[jobs:noop] enqueue ${name} (очередь не подключена)`);
  }
}

const jobsEnabled = Boolean(process.env.DATABASE_URL) && process.env.JOBS_DISABLED !== "1";
const queue: JobQueue = jobsEnabled ? pgBossQueue : new NoopQueue();

export async function enqueue<N extends JobName>(
  name: N,
  data: JobPayloads[N],
  opts?: { startAfter?: Date },
): Promise<void> {
  try {
    await queue.enqueue(name, data, opts);
  } catch (e) {
    // Очередь недоступна — не срываем основную операцию.
    console.error(`[jobs] не удалось поставить задачу ${name}:`, e);
  }
}
