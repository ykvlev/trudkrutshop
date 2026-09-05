// Воркер фоновых задач. Отдельный процесс: `npm run worker`.
// НЕ импортируется витриной — активируется после `npm install pg-boss` и БД.
//
// Регистрирует обработчики на каждую задачу и cron-расписания.

import { getBoss } from "./queue-pgboss";
import { SCHEDULES, type JobName } from "./types";
import * as h from "./handlers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HANDLERS: Record<JobName, (data: any) => Promise<void>> = {
  "certificate.send": h.certificateSend,
  "email.order-confirmation": h.orderConfirmation,
  "email.order-shipped": h.orderShipped,
  "reservation.release": h.reservationRelease,
  "webhook.retry": h.webhookRetry,
  "crm.sync": h.crmSync,
};

async function main() {
  const boss = await getBoss();
  boss.on("error", (e) => console.error("[worker] pg-boss error:", e));

  for (const [name, handler] of Object.entries(HANDLERS) as [JobName, (d: unknown) => Promise<void>][]) {
    // pg-boss отдаёт задачи пачкой — обрабатываем каждую.
    await boss.work(name, async (jobs: unknown) => {
      const list = Array.isArray(jobs) ? jobs : [jobs];
      for (const job of list) await handler((job as { data: unknown }).data);
    });
  }

  // Периодические задачи (cron).
  for (const [name, cron] of Object.entries(SCHEDULES) as [JobName, string][]) {
    await boss.schedule(name, cron, {});
  }

  console.info(`[worker] запущен: ${Object.keys(HANDLERS).length} обработчиков, ${Object.keys(SCHEDULES).length} расписаний`);
}

main().catch((e) => {
  console.error("[worker] не удалось запустить:", e);
  process.exit(1);
});
