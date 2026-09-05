// Фискализация 54-ФЗ через облачную кассу Точки. Нюанс сертификатов:
// продажа сертификата — АВАНС (prepayment), погашение — ЗАЧЁТ аванса (offset).
// Ставки НДС и признак предмета расчёта настраиваются в ЛК (блокеры №5, №9).

export type Vat = "none" | "vat0" | "vat10" | "vat20" | "vat10_110" | "vat20_120";

export type PaymentSubject =
  | "commodity" // товар
  | "payment" // аванс/зачёт (сертификат)
  | "service";

export type FiscalLine = {
  name: string;
  price: number; // рубли за единицу
  quantity: number;
  vat: Vat;
  paymentSubject: PaymentSubject;
};

export type ReceiptKind = "sale" | "prepayment" | "offset" | "refund";

export type ReceiptParams = {
  kind: ReceiptKind;
  orderNumber: string;
  email: string;
  lines: FiscalLine[];
};

export type FiscalReceipt = {
  receiptId: string;
  ofdUrl?: string;
};

export interface FiscalProvider {
  registerReceipt(params: ReceiptParams): Promise<FiscalReceipt>;
}

class MockFiscalProvider implements FiscalProvider {
  async registerReceipt(p: ReceiptParams): Promise<FiscalReceipt> {
    return { receiptId: `mock_receipt_${p.kind}_${p.orderNumber}` };
  }
}

class TochkaFiscalProvider implements FiscalProvider {
  constructor(private readonly apiKey: string) {}
  async registerReceipt(): Promise<FiscalReceipt> {
    throw new Error("TochkaFiscalProvider: не реализовано — ждём облачную кассу Точки");
  }
}

export function getFiscalProvider(): FiscalProvider {
  const key = process.env.TOCHKA_API_KEY;
  if (key) return new TochkaFiscalProvider(key);
  return new MockFiscalProvider();
}
