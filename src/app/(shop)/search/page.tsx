import type { Metadata } from "next";
import { ProductCard } from "@/components/shop/product-card";
import { IconSearch } from "@/components/shop/icons";
import { searchProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Поиск",
  robots: { index: false, follow: true },
};

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const raw = sp.q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();
  const results = q ? await searchProducts(q) : [];

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <p className="label">Поиск</p>
      <h1>{q ? `Результаты по запросу «${q}»` : "Поиск по магазину"}</h1>

      <form action="/search" className="search" style={{ maxWidth: 420, margin: "20px 0 28px", background: "var(--rso-surface-muted)", border: "1px solid var(--rso-border)" }}>
        <IconSearch width={18} height={18} />
        <input name="q" defaultValue={q} placeholder="Название или артикул" aria-label="Поиск" style={{ color: "var(--rso-black)" }} />
      </form>

      {q && (
        <p className="toolbar-c" style={{ marginBottom: 18 }}>
          {results.length} {plural(results.length, "результат", "результата", "результатов")}
        </p>
      )}

      {results.length > 0 ? (
        <div className="pgrid">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : q ? (
        <div className="stub"><p>Ничего не найдено. Попробуйте другой запрос или загляните в каталог.</p></div>
      ) : null}
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
