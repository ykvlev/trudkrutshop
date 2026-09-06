import type { ReactNode } from "react";
import { CartProvider } from "@/components/shop/cart-provider";
import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";
import { CookieBanner } from "@/components/shop/cookie-banner";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <a href="#main" className="skip-link">Перейти к содержимому</a>
      <div className="app">
        <SiteHeader />
        <main id="main" style={{ flex: 1 }}>{children}</main>
        <SiteFooter />
      </div>
      <CookieBanner />
    </CartProvider>
  );
}
