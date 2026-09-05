// Чистые функции расчёта корзины: цены, скидки, промокоды, сертификаты.
// Без привязки к Prisma/Next — легко покрываются юнит-тестами (план §10).
// Деньги здесь — числа в рублях; на границе с БД конвертируются в Decimal.

export type CartLine = {
  price: number; // цена за единицу (снимок)
  quantity: number;
  categorySlug?: string;
};

export type Promo = {
  type: "PERCENT" | "FIXED";
  value: number;
  minAmount?: number | null;
  categoryScope?: string[]; // пусто = все категории
};

export function lineTotal(line: CartLine): number {
  return round2(line.price * line.quantity);
}

export function subtotalOf(lines: CartLine[]): number {
  return round2(lines.reduce((s, l) => s + lineTotal(l), 0));
}

/** Сумма скидки по промокоду. Возвращает 0, если промокод неприменим. */
export function promoDiscount(lines: CartLine[], promo: Promo): number {
  const scope = promo.categoryScope ?? [];
  const eligible = scope.length
    ? lines.filter((l) => l.categorySlug && scope.includes(l.categorySlug))
    : lines;
  const base = subtotalOf(eligible);
  if (base <= 0) return 0;
  if (promo.minAmount != null && subtotalOf(lines) < promo.minAmount) return 0;

  const raw = promo.type === "PERCENT" ? (base * promo.value) / 100 : promo.value;
  return round2(Math.min(raw, base)); // скидка не больше суммы подходящих позиций
}

export type Totals = {
  subtotal: number;
  discount: number;
  certificateApplied: number;
  deliveryCost: number;
  total: number;
};

/** Итоги корзины. Сертификат гасит остаток после скидки, но не уводит в минус;
 * доставка добавляется поверх и сертификатом не покрывается. */
export function computeTotals(params: {
  lines: CartLine[];
  promo?: Promo | null;
  certificateBalance?: number;
  deliveryCost?: number;
}): Totals {
  const subtotal = subtotalOf(params.lines);
  const discount = params.promo ? promoDiscount(params.lines, params.promo) : 0;
  const afterDiscount = Math.max(0, round2(subtotal - discount));

  const certificateApplied = params.certificateBalance
    ? round2(Math.min(params.certificateBalance, afterDiscount))
    : 0;

  const deliveryCost = params.deliveryCost ?? 0;
  const total = round2(afterDiscount - certificateApplied + deliveryCost);

  return { subtotal, discount, certificateApplied, deliveryCost, total };
}

/** Округление до копеек без накопления ошибок float. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
