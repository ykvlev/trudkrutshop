// Фоновые задачи ТрудКрутШоп. Типы имён и полезной нагрузки — единый контракт
// для отправителя (server actions) и обработчиков (worker). Реализация очереди —
// pg-boss поверх той же Postgres (без отдельного Redis, см. план 4.1).

export type JobPayloads = {
  // Отложенная отправка сертификата получателю в назначенное время.
  "certificate.send": { certificateId: string };
  // Транзакционные письма покупателю.
  "email.order-confirmation": { orderId: string };
  "email.order-shipped": { orderId: string; trackNumber: string };
  // Снятие брони остатка по таймауту неоплаты (cron).
  "reservation.release": { olderThanMinutes?: number };
  // Повтор обработки вебхука (оплата/доставка) при сбое.
  "webhook.retry": { system: "TOCHKA" | "SAFEROUTE"; logId: string };
  // Синхронизация остатков/заказов с 1С/Битрикс24 (cron).
  "crm.sync": Record<string, never>;
};

export type JobName = keyof JobPayloads;

export interface JobQueue {
  /** Поставить задачу в очередь (опционально с задержкой/временем запуска). */
  enqueue<N extends JobName>(name: N, data: JobPayloads[N], opts?: { startAfter?: Date }): Promise<void>;
}

// Расписания cron для периодических задач (регистрируются воркером).
export const SCHEDULES: Partial<Record<JobName, string>> = {
  "reservation.release": "*/5 * * * *", // каждые 5 минут
  "crm.sync": "*/15 * * * *", // каждые 15 минут
};
