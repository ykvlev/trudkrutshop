import type { ReactNode } from "react";
import { CartProvider } from "@/components/shop/cart-provider";
import { SiteHeader, type NavCategory } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";
import { CookieBanner } from "@/components/shop/cookie-banner";
import { getTopCategories, getChildren } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const tops = await getTopCategories();
  const nav: NavCategory[] = await Promise.all(
    tops.map(async (c) => ({
      slug: c.slug,
      name: c.name,
      children: (await getChildren(c.slug)).map((k) => ({ slug: k.slug, name: k.name })),
    })),
  );

  return (
    <CartProvider>
      <a href="#main" className="skip-link">Перейти к содержимому</a>
      <div className="app">
        <SiteHeader nav={nav} />
        <main id="main" style={{ flex: 1 }}>{children}</main>
        <SiteFooter nav={nav} />
      </div>
      <CookieBanner />
    </CartProvider>
  );
}
