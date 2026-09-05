import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductCarousel } from "@/components/shop/product-carousel";
import {
  getBoughtWith,
  getBreadcrumb,
  getCategory,
  getProduct,
  getSimilar,
  inStock,
} from "@/lib/data";

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return { title: "Товар не найден" };
  return {
    title: product.name,
    description: product.description ?? `${product.name} — купить в магазине отрядного мерча ТрудКрутШоп.`,
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [trail, category, similar, bought] = await Promise.all([
    getBreadcrumb(product.category),
    getCategory(product.category),
    getSimilar(product),
    getBoughtWith(product),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    category: category?.name,
    sku: product.variants[0]?.sku,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "RUB",
      availability: inStock(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Хлебные крошки" className="crumbs">
        <Link href="/">Главная</Link>
        {trail.map((c, idx) => {
          const path = "/catalog/" + trail.slice(0, idx + 1).map((t) => t.slug).join("/");
          return (
            <span key={c.slug} style={{ display: "flex", gap: 8 }}>
              <span className="crumbs-s">/</span>
              <Link href={path}>{c.name}</Link>
            </span>
          );
        })}
        <span className="crumbs-s">/</span>
        <span>{product.name}</span>
      </nav>

      <ProductDetail product={product} />

      <ProductCarousel title="Похожие товары" items={similar} />
      <ProductCarousel title="С этим покупают" items={bought} />
    </div>
  );
}
