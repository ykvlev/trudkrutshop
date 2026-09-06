import { describe, expect, it } from "vitest";
import { orderConfirmationEmail, orderShippedEmail, certificateEmail } from "./index";

// Intl.NumberFormat разделяет разряды неразрывными пробелами — нормализуем.
const norm = (s: string) => s.replace(/[\s  ]+/g, " ");

describe("orderConfirmationEmail", () => {
  const mail = orderConfirmationEmail({
    number: "ТКШ-000123",
    items: [
      { name: "Футболка РСО", qty: 2, price: 1200 },
      { name: "Значок", qty: 3, price: 150 },
    ],
    total: 2850,
    payLegal: false,
  });

  it("тема содержит номер заказа", () => {
    expect(mail.subject).toContain("ТКШ-000123");
  });

  it("тело содержит позиции и итог", () => {
    expect(mail.html).toContain("Футболка РСО");
    expect(mail.html).toContain("Значок");
    expect(norm(mail.html)).toContain("2 850 ₽");
  });

  it("ветка физлица — про оплату картой", () => {
    expect(mail.html).toContain("картой");
  });

  it("ветка юрлица — про счёт", () => {
    const legal = orderConfirmationEmail({ number: "ТКШ-1", items: [], total: 0, payLegal: true });
    expect(legal.html).toContain("Счёт на оплату");
  });

  it("экранирует HTML в названии (защита от инъекций)", () => {
    const m = orderConfirmationEmail({
      number: "X",
      items: [{ name: '<script>alert(1)</script>', qty: 1, price: 100 }],
      total: 100,
    });
    expect(m.html).not.toContain("<script>alert(1)</script>");
    expect(m.html).toContain("&lt;script&gt;");
  });
});

describe("orderShippedEmail", () => {
  it("содержит трек-номер", () => {
    const mail = orderShippedEmail({ number: "ТКШ-9", trackNumber: "SR123456789" });
    expect(mail.subject).toContain("ТКШ-9");
    expect(mail.html).toContain("SR123456789");
  });
});

describe("certificateEmail", () => {
  it("содержит код и номинал", () => {
    const mail = certificateEmail({ code: "RSO-AAAA-BBBB-CCCC", nominal: 3000 });
    expect(mail.html).toContain("RSO-AAAA-BBBB-CCCC");
    expect(norm(mail.html)).toContain("3 000 ₽");
  });
});
