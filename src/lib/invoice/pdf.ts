// Генерация счёта на оплату (PDF) для заказов юрлиц.
// pdf-lib + fontkit со встроенным шрифтом Onest (кириллица).

import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { getSeller } from "./seller";
import { rublesInWords } from "./rubles-in-words";

export type InvoiceBuyer = {
  name: string;
  inn: string;
  kpp?: string | null;
  legalAddress?: string | null;
};

export type InvoiceLine = {
  name: string;
  quantity: number;
  price: number; // за единицу, руб.
};

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: Date;
  buyer: InvoiceBuyer;
  lines: InvoiceLine[];
  deliveryCost: number;
};

const A4: [number, number] = [595.28, 841.89];
const M = 40; // поля
const INK = rgb(0.05, 0.05, 0.05);
const MUTE = rgb(0.4, 0.4, 0.4);
const LINE = rgb(0.8, 0.8, 0.8);
const BLUE = rgb(0.031, 0.016, 1); // #0804FF

function fontPath(file: string): string {
  return path.join(process.cwd(), "src", "lib", "invoice", "fonts", file);
}

const money = (n: number) =>
  n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Обрезка длинного текста по ширине колонки.
function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && font.widthOfTextAtSize(s + "…", size) > maxWidth) s = s.slice(0, -1);
  return s + "…";
}

export async function buildInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const seller = getSeller();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(fs.readFileSync(fontPath("onest-regular.ttf")), { subset: true });
  const bold = await doc.embedFont(fs.readFileSync(fontPath("onest-bold.ttf")), { subset: true });

  const page = doc.addPage(A4);
  const W = A4[0];
  let y = A4[1] - M;

  const text = (
    p: PDFPage,
    s: string,
    x: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {},
  ) => {
    p.drawText(s, { x, y: yy, font: opts.font ?? regular, size: opts.size ?? 9, color: opts.color ?? INK });
  };

  // ── Банковская «шапка» продавца (таблица реквизитов) ──────────────
  const boxW = W - M * 2;
  const bankTop = y;
  const rows = [
    ["Банк получателя", seller.bankName],
    ["БИК", seller.bankBik],
    ["Кор. счёт", seller.corrAccount],
    ["Получатель", `${seller.name}, ИНН ${seller.inn}, КПП ${seller.kpp}`],
    ["Расчётный счёт", seller.bankAccount],
  ];
  const rowH = 18;
  const labelW = 130;
  rows.forEach((r, i) => {
    const ry = bankTop - i * rowH;
    page.drawRectangle({ x: M, y: ry - rowH, width: boxW, height: rowH, borderColor: LINE, borderWidth: 0.6 });
    page.drawLine({ start: { x: M + labelW, y: ry }, end: { x: M + labelW, y: ry - rowH }, color: LINE, thickness: 0.6 });
    text(page, r[0], M + 6, ry - 13, { size: 8, color: MUTE });
    text(page, fit(r[1], regular, 9, boxW - labelW - 12), M + labelW + 6, ry - 13, { size: 9 });
  });
  y = bankTop - rows.length * rowH - 24;

  // ── Заголовок счёта ────────────────────────────────────────────────
  const dateStr = data.invoiceDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  text(page, `Счёт на оплату № ${data.invoiceNumber} от ${dateStr}`, M, y, { font: bold, size: 15, color: BLUE });
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, color: BLUE, thickness: 1.5 });
  y -= 22;

  // ── Поставщик / Покупатель ─────────────────────────────────────────
  text(page, "Поставщик:", M, y, { font: bold, size: 9 });
  text(page, fit(`${seller.name}, ИНН ${seller.inn}, КПП ${seller.kpp}, ${seller.legalAddress}`, regular, 9, boxW - 70), M + 65, y, { size: 9 });
  y -= 16;
  const buyerLine = `${data.buyer.name}, ИНН ${data.buyer.inn}${data.buyer.kpp ? `, КПП ${data.buyer.kpp}` : ""}${data.buyer.legalAddress ? `, ${data.buyer.legalAddress}` : ""}`;
  text(page, "Покупатель:", M, y, { font: bold, size: 9 });
  text(page, fit(buyerLine, regular, 9, boxW - 70), M + 65, y, { size: 9 });
  y -= 26;

  // ── Таблица позиций ────────────────────────────────────────────────
  // Колонки: №, Товар, Кол-во, Цена, Сумма
  const cNum = M;
  const cName = M + 26;
  const cQty = W - M - 200;
  const cPrice = W - M - 130;
  const cSum = W - M - 60;
  const nameW = cQty - cName - 8;

  const headY = y;
  page.drawRectangle({ x: M, y: headY - 20, width: boxW, height: 20, color: rgb(0.95, 0.95, 1) });
  text(page, "№", cNum + 4, headY - 14, { font: bold, size: 8, color: MUTE });
  text(page, "Товар", cName, headY - 14, { font: bold, size: 8, color: MUTE });
  text(page, "Кол-во", cQty, headY - 14, { font: bold, size: 8, color: MUTE });
  text(page, "Цена", cPrice, headY - 14, { font: bold, size: 8, color: MUTE });
  text(page, "Сумма", cSum, headY - 14, { font: bold, size: 8, color: MUTE });
  y = headY - 20;

  let subtotal = 0;
  data.lines.forEach((l, i) => {
    const sum = l.price * l.quantity;
    subtotal += sum;
    const ry = y - 18;
    page.drawRectangle({ x: M, y: ry, width: boxW, height: 18, borderColor: LINE, borderWidth: 0.4 });
    text(page, String(i + 1), cNum + 4, ry + 5, { size: 9 });
    text(page, fit(l.name, regular, 9, nameW), cName, ry + 5, { size: 9 });
    text(page, String(l.quantity), cQty + 4, ry + 5, { size: 9 });
    text(page, money(l.price), cPrice, ry + 5, { size: 9 });
    text(page, money(sum), cSum, ry + 5, { size: 9 });
    y = ry;
  });

  if (data.deliveryCost > 0) {
    subtotal += data.deliveryCost;
    const ry = y - 18;
    page.drawRectangle({ x: M, y: ry, width: boxW, height: 18, borderColor: LINE, borderWidth: 0.4 });
    text(page, String(data.lines.length + 1), cNum + 4, ry + 5, { size: 9 });
    text(page, "Доставка", cName, ry + 5, { size: 9 });
    text(page, "1", cQty + 4, ry + 5, { size: 9 });
    text(page, money(data.deliveryCost), cPrice, ry + 5, { size: 9 });
    text(page, money(data.deliveryCost), cSum, ry + 5, { size: 9 });
    y = ry;
  }

  // ── Итоги ──────────────────────────────────────────────────────────
  y -= 14;
  text(page, "Итого:", cPrice - 40, y, { font: bold, size: 10 });
  text(page, money(subtotal) + " ₽", cSum, y, { font: bold, size: 10 });
  y -= 14;
  text(page, seller.vatNote, cPrice - 40, y, { size: 9, color: MUTE });
  y -= 14;
  text(page, "Всего к оплате:", cPrice - 90, y, { font: bold, size: 11, color: BLUE });
  text(page, money(subtotal) + " ₽", cSum, y, { font: bold, size: 11, color: BLUE });
  y -= 26;

  // ── Сумма прописью ─────────────────────────────────────────────────
  const words = rublesInWords(subtotal);
  text(page, `Всего наименований ${data.lines.length}, на сумму ${money(subtotal)} руб.`, M, y, { size: 9 });
  y -= 14;
  text(page, fit(words + ".", bold, 9, boxW), M, y, { font: bold, size: 9 });
  y -= 30;

  // ── Подпись ────────────────────────────────────────────────────────
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, color: LINE, thickness: 0.6 });
  y -= 18;
  text(page, "Руководитель ______________________", M, y, { size: 9 });
  text(page, `/ ${seller.signer} /`, M + 220, y, { size: 9, color: MUTE });
  y -= 24;
  text(page, `Оплата счёта означает согласие с условиями. ${seller.phone} · ${seller.email}`, M, y, { size: 8, color: MUTE });

  return doc.save();
}
