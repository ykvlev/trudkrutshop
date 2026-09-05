import { describe, expect, it } from "vitest";
import {
  computeTotals,
  lineTotal,
  promoDiscount,
  subtotalOf,
  type CartLine,
  type Promo,
} from "./pricing";

const lines: CartLine[] = [
  { price: 250, quantity: 2, categorySlug: "piny" }, // 500
  { price: 3450, quantity: 1, categorySlug: "hudi" }, // 3450
];

describe("subtotal", () => {
  it("складывает позиции", () => {
    expect(lineTotal(lines[0])).toBe(500);
    expect(subtotalOf(lines)).toBe(3950);
  });
});

describe("promoDiscount", () => {
  it("процентная скидка на всю корзину", () => {
    const p: Promo = { type: "PERCENT", value: 10 };
    expect(promoDiscount(lines, p)).toBe(395);
  });

  it("фиксированная скидка", () => {
    const p: Promo = { type: "FIXED", value: 300 };
    expect(promoDiscount(lines, p)).toBe(300);
  });

  it("не превышает сумму подходящих позиций", () => {
    const p: Promo = { type: "FIXED", value: 10000 };
    expect(promoDiscount(lines, p)).toBe(3950);
  });

  it("учитывает минимальную сумму", () => {
    const p: Promo = { type: "PERCENT", value: 10, minAmount: 5000 };
    expect(promoDiscount(lines, p)).toBe(0);
  });

  it("ограничение по категории считает только её позиции", () => {
    const p: Promo = { type: "PERCENT", value: 20, categoryScope: ["piny"] };
    expect(promoDiscount(lines, p)).toBe(100); // 20% от 500
  });
});

describe("computeTotals", () => {
  it("скидка + сертификат + доставка, без ухода в минус", () => {
    const t = computeTotals({
      lines,
      promo: { type: "PERCENT", value: 10 }, // -395 → 3555
      certificateBalance: 1000, // -1000 → 2555
      deliveryCost: 300, // +300 → 2855
    });
    expect(t.subtotal).toBe(3950);
    expect(t.discount).toBe(395);
    expect(t.certificateApplied).toBe(1000);
    expect(t.deliveryCost).toBe(300);
    expect(t.total).toBe(2855);
  });

  it("сертификат не гасит больше, чем сумма после скидки", () => {
    const t = computeTotals({ lines: [{ price: 500, quantity: 1 }], certificateBalance: 10000 });
    expect(t.certificateApplied).toBe(500);
    expect(t.total).toBe(0);
  });
});
