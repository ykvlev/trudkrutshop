import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/shop/catalog-view";
import { ProductThumb } from "@/components/shop/product-thumb";
import {
  getBreadcrumb,
  getCategory,
  getCategoryProducts,
  getChildren,
  isLeafCategory,
} from "@/lib/data";

export async function generateMetadata(props: PageProps<"/catalog/[...slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const cat = await getCategory(slug[slug.length - 1]);
  if (!cat) return { title: "Каталог" };
  return {
    title: cat.name,
    description: cat.seoText ?? `${cat.name} — отрядный мерч РСО в магазине ТрудКрутШоп.`,
  };
}

export default async function CategoryPage(props: PageProps<"/catalog/[...slug]">) {
  const { slug } = await props.params;
  const current = slug[slug.length - 1];
  const cat = await getCategory(current);
  if (!cat) notFound();

  const [trail, leaf] = await Promise.all([getBreadcrumb(current), isLeafCategory(current)]);
  const items = leaf ? await getCategoryProducts(current) : [];
  const children = leaf ? [] : await getChildren(current);
  const childCounts = await Promise.all(children.map((k) => getCategoryProducts(k.slug)));

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <nav aria-label="Хлебные крошки" className="crumbs">
        <Link href="/">Главная</Link>
        {trail.map((c, idx) => {
          const path = "/catalog/" + trail.slice(0, idx + 1).map((t) => t.slug).join("/");
          const last = idx === trail.length - 1;
          return (
            <span key={c.slug} style={{ display: "flex", gap: 8 }}>
              <span className="crumbs-s">/</span>
              {last ? <span>{c.name}</span> : <Link href={path}>{c.name}</Link>}
            </span>
          );
        })}
      </nav>

      <p className="label">Каталог</p>
      <h1>{cat.name}</h1>

      {leaf ? (
        <>
          {cat.seoText && <p className="seo" style={{ marginBottom: 24 }}>{cat.seoText}</p>}
          <CatalogView items={items} />
        </>
      ) : (
        <div className="sgrid">
          {children.map((k, i) => {
            const count = childCounts[i].length;
            return (
              <Link key={k.slug} href={`/catalog/${k.slug}`} className="scard">
                <ProductThumb label={k.name} />
                <div className="scard-b">
                  <span className="scard-n">{k.name}</span>
                  <span className="scard-c">{count} {plural(count, "товар", "товара", "товаров")}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
