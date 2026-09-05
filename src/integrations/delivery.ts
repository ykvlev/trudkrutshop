// Доставка через SafeRoute за интерфейсом. Требует корректных веса и габаритов
// у КАЖДОГО товара (это в карточки) — иначе расчёт неверен (план 6.6).

export type Dimensions = { length: number; width: number; height: number }; // мм

export type CalcParams = {
  toPostcode?: string;
  toCity?: string;
  weightG: number;
  dims: Dimensions;
  declaredValue: number; // рубли, для страховки
};

export type DeliveryQuote = {
  serviceCode: string;
  serviceName: string;
  cost: number; // рубли
  minDays: number;
  maxDays: number;
};

export type PickupPoint = {
  code: string;
  address: string;
  lat: number;
  lng: number;
};

export type ShipmentParams = {
  orderNumber: string;
  serviceCode: string;
  pickupPointCode?: string;
  weightG: number;
  dims: Dimensions;
};

export type Shipment = {
  trackNumber: string;
  labelUrl?: string;
};

export type DeliveryWebhook = {
  trackNumber: string;
  status: string;
  raw: unknown;
};

export interface DeliveryProvider {
  calculate(params: CalcParams): Promise<DeliveryQuote[]>;
  listPickupPoints(city: string): Promise<PickupPoint[]>;
  createShipment(params: ShipmentParams): Promise<Shipment>;
  parseWebhook(body: string, signature: string | null): Promise<DeliveryWebhook>;
}

class MockDeliveryProvider implements DeliveryProvider {
  async calculate(p: CalcParams): Promise<DeliveryQuote[]> {
    const base = 250 + Math.ceil(p.weightG / 500) * 40;
    return [
      { serviceCode: "pvz", serviceName: "До пункта выдачи", cost: base, minDays: 2, maxDays: 5 },
      { serviceCode: "courier", serviceName: "Курьером до двери", cost: base + 200, minDays: 1, maxDays: 3 },
    ];
  }
  async listPickupPoints(): Promise<PickupPoint[]> {
    return [{ code: "MSK-001", address: "Москва, Лефортовский пер., 8", lat: 55.766, lng: 37.685 }];
  }
  async createShipment(p: ShipmentParams): Promise<Shipment> {
    return { trackNumber: `MOCK${p.orderNumber}` };
  }
  async parseWebhook(body: string): Promise<DeliveryWebhook> {
    const d = JSON.parse(body) as { trackNumber: string; status: string };
    return { trackNumber: d.trackNumber, status: d.status, raw: d };
  }
}

class SafeRouteProvider implements DeliveryProvider {
  constructor(private readonly apiKey: string) {}
  async calculate(): Promise<DeliveryQuote[]> {
    throw new Error("SafeRouteProvider: не реализовано — ждём договор и API-ключ SafeRoute");
  }
  async listPickupPoints(): Promise<PickupPoint[]> {
    throw new Error("SafeRouteProvider.listPickupPoints: не реализовано");
  }
  async createShipment(): Promise<Shipment> {
    throw new Error("SafeRouteProvider.createShipment: не реализовано");
  }
  async parseWebhook(): Promise<DeliveryWebhook> {
    throw new Error("SafeRouteProvider.parseWebhook: не реализовано");
  }
}

export function getDeliveryProvider(): DeliveryProvider {
  const key = process.env.SAFEROUTE_API_KEY;
  if (key) return new SafeRouteProvider(key);
  return new MockDeliveryProvider();
}
