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

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ТрудКрутШоп",
  description: "Магазин официального мерча Российских Студенческих Отрядов.",
  url: "https://trudkrutshop.ru",
  logo: "https://trudkrutshop.ru/brand/mark-trudkrut.svg",
};

const siteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ТрудКрутШоп",
  url: "https://trudkrutshop.ru",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://trudkrutshop.ru/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${stolzl.variable} ${onest.variable} ${actay.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
        {children}
      </body>
    </html>
  );
}
