// Платёжный провайдер за интерфейсом. Бизнес-логика зависит от PaymentProvider,
// а не от Точки напрямую → смена эквайринга меняет одну реализацию.
// Подтверждение оплаты приходит ТОЛЬКО по вебхуку (не по редиректу) — см. план 6.2.

import type { FiscalLine } from "./fiscal";

export type CreatePaymentParams = {
  orderId: string;
  orderNumber: string;
  amount: number; // рубли
  description: string;
  customerEmail: string;
  returnUrl: string;
  lines: FiscalLine[]; // состав для фискального чека
};

export type CreatedPayment = {
  paymentId: string;
  paymentUrl: string; // страница оплаты, куда редиректим покупателя
};

export type PaymentWebhook = {
  paymentId: string;
  status: "paid" | "failed" | "refunded";
  raw: unknown;
};

export interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<CreatedPayment>;
  /** Разбор и ПРОВЕРКА ПОДПИСИ входящего вебхука. Бросает при неверной подписи. */
  parseWebhook(body: string, signature: string | null): Promise<PaymentWebhook>;
  refund(paymentId: string, amount: number): Promise<void>;
}

// Мок для разработки и e2e: сразу выдаёт «оплату» на внутренний sandbox-URL.
class MockPaymentProvider implements PaymentProvider {
  async createPayment(p: CreatePaymentParams): Promise<CreatedPayment> {
    return {
      paymentId: `mock_${p.orderId}`,
      paymentUrl: `/api/dev/pay?order=${encodeURIComponent(p.orderNumber)}`,
    };
  }
  async parseWebhook(body: string): Promise<PaymentWebhook> {
    const data = JSON.parse(body) as { paymentId: string; status?: PaymentWebhook["status"] };
    return { paymentId: data.paymentId, status: data.status ?? "paid", raw: data };
  }
  async refund(): Promise<void> {}
}

// Реальный провайдер Точки. Документация закрыта до подписания договора —
// объём работ виден только после доступа к ЛК (заложен запас в плане).
class TochkaPaymentProvider implements PaymentProvider {
  constructor(private readonly apiKey: string) {}
  async createPayment(): Promise<CreatedPayment> {
    throw new Error("TochkaPaymentProvider: не реализовано — ждём договор и ключи ЛК Точки");
  }
  async parseWebhook(): Promise<PaymentWebhook> {
    throw new Error("TochkaPaymentProvider.parseWebhook: не реализовано");
  }
  async refund(): Promise<void> {
    throw new Error("TochkaPaymentProvider.refund: не реализовано");
  }
}

export function getPaymentProvider(): PaymentProvider {
  const key = process.env.TOCHKA_API_KEY;
  if (key) return new TochkaPaymentProvider(key);
  return new MockPaymentProvider();
}
