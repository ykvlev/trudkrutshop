// Очередь на pg-boss (поверх той же Postgres). НЕ подключено: активируется
// после `npm install pg-boss` и подъёма БД — заменой очереди в jobs/index.ts.

import PgBoss from "pg-boss";
import type { JobName, JobPayloads, JobQueue } from "./types";

let boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (boss) return boss;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL не задан для pg-boss");
  boss = new PgBoss({ connectionString });
  await boss.start();
  return boss;
}

export const pgBossQueue: JobQueue = {
  async enqueue<N extends JobName>(name: N, data: JobPayloads[N], opts?: { startAfter?: Date }) {
    const b = await getBoss();
    await b.send(name, data ?? {}, opts?.startAfter ? { startAfter: opts.startAfter } : {});
  },
};
