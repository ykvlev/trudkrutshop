import type { MetadataRoute } from "next";

// robots.txt: закрываем служебное (админка, api, корзина, закрытые страницы регионов).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/cart", "/r/"] },
    ],
    sitemap: "https://trudkrutshop.ru/sitemap.xml",
  };
}
