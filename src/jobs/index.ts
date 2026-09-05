// Фасад постановки задач. Сейчас — заглушка (лог), безопасно импортируется из
// server actions. Когда поднимется БД и pg-boss:
//
//   import { pgBossQueue } from "./queue-pgboss";
//   const queue = pgBossQueue;
//
// и enqueue начнёт реально ставить задачи. Обработчики — в worker.ts.

import type { JobName, JobPayloads, JobQueue } from "./types";

class NoopQueue implements JobQueue {
  async enqueue<N extends JobName>(name: N, _data: JobPayloads[N]): Promise<void> {
    console.info(`[jobs:noop] enqueue ${name} (очередь не подключена)`);
  }
}

const queue: JobQueue = new NoopQueue();

export async function enqueue<N extends JobName>(
  name: N,
  data: JobPayloads[N],
  opts?: { startAfter?: Date },
): Promise<void> {
  return queue.enqueue(name, data, opts);
}
