import type { ReactNode } from "react";
import { CartProvider } from "@/components/shop/cart-provider";
import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="app">
        <SiteHeader />
        <main style={{ flex: 1 }}>{children}</main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
