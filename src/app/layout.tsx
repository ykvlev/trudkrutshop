import type { Metadata, Viewport } from "next";
import { actay, onest, stolzl } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://trudkrutshop.ru"),
  title: {
    default: "ТрудКрутШоп — магазин отрядного мерча РСО",
    template: "%s — ТрудКрутШоп",
  },
  description:
    "Официальный мерч Российских Студенческих Отрядов: футболки, худи, значки, аксессуары и подарочные сертификаты. #ТрудКрут, а ты ещё круче!",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "ТрудКрутШоп",
  },
};

export const viewport: Viewport = {
  themeColor: "#0804ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${stolzl.variable} ${onest.variable} ${actay.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
