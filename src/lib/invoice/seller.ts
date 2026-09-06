// Реквизиты продавца для счёта на оплату.
// TODO(заказчик): подставить боевые реквизиты (или задать через ENV при деплое).
// Пока значения-заглушки — структура счёта готова, данные заполняются позже.

export type SellerRequisites = {
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legalAddress: string;
  bankName: string;
  bankBik: string;
  bankAccount: string;
  corrAccount: string;
  signer: string;
  vatNote: string; // «Без налога (НДС)» для УСН или «В том числе НДС 20%»
  phone: string;
  email: string;
};

const e = (key: string, fallback: string) => process.env[key]?.trim() || fallback;

export function getSeller(): SellerRequisites {
  return {
    name: e("SELLER_NAME", 'ООО «ТрудКрутШоп» (реквизиты уточняются)'),
    inn: e("SELLER_INN", "0000000000"),
    kpp: e("SELLER_KPP", "000000000"),
    ogrn: e("SELLER_OGRN", "0000000000000"),
    legalAddress: e("SELLER_ADDRESS", "Россия, г. Москва"),
    bankName: e("SELLER_BANK_NAME", "Банк не указан"),
    bankBik: e("SELLER_BANK_BIK", "000000000"),
    bankAccount: e("SELLER_BANK_ACCOUNT", "00000000000000000000"),
    corrAccount: e("SELLER_CORR_ACCOUNT", "00000000000000000000"),
    signer: e("SELLER_SIGNER", "Руководитель"),
    vatNote: e("SELLER_VAT_NOTE", "Без налога (НДС)"),
    phone: e("SELLER_PHONE", "+7 (000) 000-00-00"),
    email: e("SELLER_EMAIL", "info@trudkrutshop.ru"),
  };
}
