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

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return { title: "Товар не найден" };
  return {
    title: product.name,
    description: product.description ?? `${product.name} — купить в магазине отрядного мерча ТрудКрутШоп.`,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      url: `/product/${slug}`,
    },
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

  const base = "https://trudkrutshop.ru";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: category?.name,
    sku: product.variants[0]?.sku,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "RUB",
      url: `${base}/product/${slug}`,
      availability: inStock(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  // Хлебные крошки для поисковиков.
  const crumbItems = [
    { name: "Главная", url: base },
    ...trail.map((c, idx) => ({
      name: c.name,
      url: `${base}/catalog/${trail.slice(0, idx + 1).map((t) => t.slug).join("/")}`,
    })),
    { name: product.name, url: `${base}/product/${slug}` },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbItems.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

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
