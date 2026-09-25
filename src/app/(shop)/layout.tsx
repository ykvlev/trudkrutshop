import type { ReactNode } from "react";
import { CartProvider } from "@/components/shop/cart-provider";
import { CartDrawerProvider } from "@/components/shop/cart-drawer";
import { SiteHeader, type NavCategory } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";
import { CookieBanner } from "@/components/shop/cookie-banner";
import { getCategoryTree } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const nav: NavCategory[] = await getCategoryTree();

  return (
    <CartProvider>
      <CartDrawerProvider>
        <a href="#main" className="skip-link">Перейти к содержимому</a>
        <div className="app">
          <SiteHeader nav={nav} />
          <main id="main" style={{ flex: 1 }}>{children}</main>
          <SiteFooter nav={nav} />
        </div>
        <CookieBanner />
      </CartDrawerProvider>
    </CartProvider>
  );
}
