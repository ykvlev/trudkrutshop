import type { Metadata } from "next";
import { certificateEmail, orderConfirmationEmail, orderShippedEmail } from "@/emails";

// Дев-страница предпросмотра транзакционных писем. Рендерит шаблоны в iframe
// с тестовыми данными — удобно смотреть вёрстку без реальной отправки.

export const metadata: Metadata = {
  title: "Предпросмотр писем",
  robots: { index: false, follow: false },
};

const samples: { title: string; doc: { subject: string; html: string } }[] = [
  {
    title: "Заказ принят (физлицо)",
    doc: orderConfirmationEmail({
      number: "ТКШ-001042",
      items: [
        { name: "Худи «РСО» серый, начёс", qty: 1, price: 3450 },
        { name: "Пин «ТрудКрут»", qty: 2, price: 250 },
      ],
      total: 4250,
    }),
  },
  {
    title: "Заказ принят (юрлицо)",
    doc: orderConfirmationEmail({
      number: "ТКШ-001040",
      items: [{ name: "Худи «ТрудКрут» синий", qty: 6, price: 3650 }],
      total: 19710,
      payLegal: true,
    }),
  },
  { title: "Заказ отправлен", doc: orderShippedEmail({ number: "ТКШ-001039", trackNumber: "SR7788123456" }) },
  { title: "Подарочный сертификат", doc: certificateEmail({ code: "RSO-4821-9034", nominal: 2000 }) },
];

export default function EmailPreviewPage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: "#6b7280", margin: 0 }}>
        Дев-инструмент
      </p>
      <h1 style={{ fontSize: 32, margin: "6px 0 4px" }}>Предпросмотр писем</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Транзакционные шаблоны (src/emails) с тестовыми данными. В проде отправляются фоновой задачей через почтовый провайдер.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24, marginTop: 24 }}>
        {samples.map((s) => (
          <div key={s.title} style={{ border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 600 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Тема: {s.doc.subject}</div>
            </div>
            <iframe title={s.title} srcDoc={s.doc.html} style={{ width: "100%", height: 520, border: 0, background: "#f4f5f7" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
