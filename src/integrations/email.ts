// Транзакционная почта за интерфейсом (React Email + SMTP российского провайдера
// на этапе внедрения). Пока mock: письма логируются, не отправляются.
// Реальный провайдер включается переменной SMTP_URL (см. .env).

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export interface EmailProvider {
  send(msg: EmailMessage): Promise<{ id: string }>;
}

class MockEmailProvider implements EmailProvider {
  async send(msg: EmailMessage): Promise<{ id: string }> {
    console.info(`[email:mock] → ${msg.to}: ${msg.subject}`);
    return { id: `mock_email_${Date.now()}` };
  }
}

class SmtpEmailProvider implements EmailProvider {
  constructor(private readonly url: string) {}
  async send(): Promise<{ id: string }> {
    // Позже: nodemailer.createTransport(this.url).sendMail(...) с SPF/DKIM/DMARC.
    throw new Error("SmtpEmailProvider: не реализовано — настроить SMTP и шаблоны React Email");
  }
}

export function getEmailProvider(): EmailProvider {
  const url = process.env.SMTP_URL;
  if (url) return new SmtpEmailProvider(url);
  return new MockEmailProvider();
}
