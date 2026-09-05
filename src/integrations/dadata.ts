// DaData: подтяжка реквизитов юрлица по ИНН и подсказки адресов (план 6.2).

export type CompanyDetails = {
  inn: string;
  kpp?: string;
  ogrn?: string;
  name: string;
  legalAddress?: string;
  management?: string; // ФИО руководителя
};

export interface DadataProvider {
  findCompanyByInn(inn: string): Promise<CompanyDetails | null>;
  suggestAddress(query: string): Promise<string[]>;
}

class MockDadataProvider implements DadataProvider {
  async findCompanyByInn(inn: string): Promise<CompanyDetails | null> {
    if (!/^\d{10}(\d{2})?$/.test(inn)) return null;
    return {
      inn,
      kpp: "770101001",
      ogrn: "1207700490249",
      name: 'АНО ДПО «РСО-РАЗВИТИЕ»',
      legalAddress: "105066, г. Москва, ул. Доброслободская, д. 6 стр. 1",
      management: "Тестовый Руководитель",
    };
  }
  async suggestAddress(query: string): Promise<string[]> {
    return query ? [`${query}, Москва`] : [];
  }
}

class DadataApiProvider implements DadataProvider {
  constructor(private readonly token: string) {}
  async findCompanyByInn(): Promise<CompanyDetails | null> {
    throw new Error("DadataApiProvider: не реализовано — нужен API-ключ DaData");
  }
  async suggestAddress(): Promise<string[]> {
    throw new Error("DadataApiProvider.suggestAddress: не реализовано");
  }
}

export function getDadataProvider(): DadataProvider {
  const token = process.env.DADATA_TOKEN;
  if (token) return new DadataApiProvider(token);
  return new MockDadataProvider();
}
