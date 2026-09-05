// ЭДО (Диадок/СБИС): формирование УПД в формате ФНС (XML+PDF), подпись КЭП,
// отправка контрагенту, отслеживание статуса. Самый непредсказуемый блок.
// Запасной вариант (MANUAL) — PDF на ручную подпись, если оператора/КЭП нет
// (блокер №3). Источник истины по нумерации при появлении 1С — учётная система.

export type UpdPayload = {
  orderNumber: string;
  updNumber: string;
  xml: string; // формат ФНС
  pdfUrl?: string;
  counterpartyInn: string;
};

export type EdoSendResult = {
  messageId: string;
  status: "sent" | "manual";
};

export interface EdoProvider {
  sendUpd(payload: UpdPayload): Promise<EdoSendResult>;
  getStatus(messageId: string): Promise<string>;
}

// Ручной режим: УПД не уходит в ЭДО, кладётся в PDF на подпись бухгалтерии.
class ManualEdoProvider implements EdoProvider {
  async sendUpd(p: UpdPayload): Promise<EdoSendResult> {
    return { messageId: `manual_${p.updNumber}`, status: "manual" };
  }
  async getStatus(): Promise<string> {
    return "manual";
  }
}

class DiadocEdoProvider implements EdoProvider {
  constructor(private readonly apiKey: string) {}
  async sendUpd(): Promise<EdoSendResult> {
    throw new Error("DiadocEdoProvider: не реализовано — ждём ЭДО-оператора и КЭП");
  }
  async getStatus(): Promise<string> {
    throw new Error("DiadocEdoProvider.getStatus: не реализовано");
  }
}

export function getEdoProvider(): EdoProvider {
  const key = process.env.DIADOC_API_KEY;
  if (key) return new DiadocEdoProvider(key);
  return new ManualEdoProvider();
}
