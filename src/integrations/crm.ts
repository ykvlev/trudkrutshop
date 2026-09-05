// CRM/учётная система (1С / Битрикс24) — слой-заглушка с интерфейсом.
// Реальная реализация появится, когда заказчик определится с системой.
// До тех пор — no-op, чтобы бизнес-логика уже могла вызывать эти точки.

export type StockSyncRow = { sku: string; stock: number };

export interface CrmProvider {
  /** Выгрузка товаров в учётную систему. */
  pushProducts(): Promise<void>;
  /** Передача заказа в учётную систему. */
  pushOrder(orderId: string): Promise<void>;
  /** Получение остатков из учётной системы. */
  pullStock(): Promise<StockSyncRow[]>;
}

class NoopCrmProvider implements CrmProvider {
  async pushProducts(): Promise<void> {}
  async pushOrder(): Promise<void> {}
  async pullStock(): Promise<StockSyncRow[]> {
    return [];
  }
}

export function getCrmProvider(): CrmProvider {
  // Появится 1С/Битрикс24 → выбор реализации по env (CRM_KIND).
  return new NoopCrmProvider();
}
