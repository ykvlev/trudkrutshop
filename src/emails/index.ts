// Транзакционные письма ТрудКрутШоп — email-safe HTML (таблицы + инлайн-стили,
// без вебшрифтов и внешнего CSS: так письма одинаково выглядят в Gmail, Яндекс,
// Mail.ru, Outlook). Чистые функции без зависимостей → используются в обработчиках
// задач и легко тестируются. При желании мигрируются на React Email без смены API.

const BLUE = "#0804ff";
const INK = "#0b0b0f";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const BG = "#f4f5f7";

export type EmailDoc = { subject: string; html: string };

const money = (v: number | string) =>
  new Intl.NumberFormat("ru-RU").format(Number(v)) + " ₽";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

/** Общая обёртка письма: синяя шапка-вордмарк, тело, подвал с реквизитами. */
function shell(title: string, body: string, preheader = ""): string {
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${BG};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
      <tr><td style="background:${BLUE};padding:22px 28px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:.5px;">ТРУДКРУТ<span style="opacity:.7;">ШОП</span></span>
      </td></tr>
      <tr><td style="padding:28px;color:${INK};font-size:15px;line-height:1.55;">
        ${body}
      </td></tr>
      <tr><td style="padding:20px 28px;background:#f9fafb;border-top:1px solid ${BORDER};color:${MUTED};font-size:12px;line-height:1.5;">
        Магазин отрядного мерча РСО · Москва, Лефортовский пер., 8 стр. 1<br>
        АНО ДПО «РСО-РАЗВИТИЕ» · ИНН 7743351523 · <a href="mailto:rso.simv@mail.ru" style="color:${BLUE};text-decoration:none;">rso.simv@mail.ru</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;color:${INK};">${esc(text)}</h1>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr>
    <td style="background:${BLUE};border-radius:10px;">
      <a href="${esc(href)}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;font-family:Arial,sans-serif;">${esc(label)}</a>
    </td></tr></table>`;
}

// ── Шаблоны ──────────────────────────────────────────────────────

export type OrderItemLine = { name: string; qty: number; price: number };

function itemsTable(items: OrderItemLine[], total: number): string {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">${esc(i.name)} <span style="color:${MUTED};">× ${i.qty}</span></td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};text-align:right;white-space:nowrap;">${money(i.price * i.qty)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;color:${INK};">
    ${rows}
    <tr><td style="padding:14px 0 0;font-weight:bold;">Итого</td>
        <td style="padding:14px 0 0;text-align:right;font-weight:bold;">${money(total)}</td></tr>
  </table>`;
}

export function orderConfirmationEmail(order: {
  number: string;
  items: OrderItemLine[];
  total: number;
  payLegal?: boolean;
}): EmailDoc {
  const body =
    heading(`Заказ ${order.number} принят`) +
    `<p style="margin:0 0 16px;">Спасибо за покупку в ТрудКрутШоп! Мы получили ваш заказ.</p>` +
    itemsTable(order.items, order.total) +
    `<p style="margin:16px 0 0;color:${MUTED};">${
      order.payLegal
        ? "Счёт на оплату отправлен отдельно. После оплаты сформируем УПД."
        : "Оплата картой на защищённой странице банка. После оплаты придёт чек."
    }</p>`;
  return { subject: `Заказ ${order.number} принят — ТрудКрутШоп`, html: shell(`Заказ ${order.number}`, body, "Мы получили ваш заказ") };
}

export function orderShippedEmail(order: { number: string; trackNumber: string }): EmailDoc {
  const body =
    heading(`Заказ ${order.number} отправлен`) +
    `<p style="margin:0 0 8px;">Ваш заказ передан в доставку.</p>` +
    `<p style="margin:0 0 4px;color:${MUTED};">Трек-номер для отслеживания:</p>` +
    `<p style="margin:0;font-size:20px;font-weight:bold;color:${BLUE};letter-spacing:.5px;">${esc(order.trackNumber)}</p>`;
  return { subject: `Заказ ${order.number} отправлен — ТрудКрутШоп`, html: shell(`Заказ ${order.number} отправлен`, body, `Трек-номер ${order.trackNumber}`) };
}

export function certificateEmail(cert: {
  code: string;
  nominal: number;
  shopUrl?: string;
}): EmailDoc {
  const body =
    heading("Вам подарочный сертификат!") +
    `<p style="margin:0 0 16px;">Кто-то дарит вам сертификат ТрудКрутШоп на отрядный мерч.</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${BLUE};border-radius:16px;">
      <tr><td style="padding:28px;text-align:center;">
        <div style="color:${MUTED};font-size:13px;text-transform:uppercase;letter-spacing:1px;">Номинал</div>
        <div style="font-size:38px;font-weight:bold;color:${INK};margin:6px 0 14px;">${money(cert.nominal)}</div>
        <div style="color:${MUTED};font-size:13px;">Код сертификата</div>
        <div style="font-size:22px;font-weight:bold;color:${BLUE};letter-spacing:2px;">${esc(cert.code)}</div>
      </td></tr>
    </table>` +
    `<p style="margin:16px 0 0;color:${MUTED};">Введите код в корзине как способ оплаты. Поддерживается частичное погашение — остаток сохранится на балансе.</p>` +
    button(cert.shopUrl ?? "https://trudkrutshop.ru", "Выбрать мерч");
  return { subject: "Ваш подарочный сертификат ТрудКрутШоп", html: shell("Подарочный сертификат", body, `Сертификат на ${money(cert.nominal)}`) };
}
