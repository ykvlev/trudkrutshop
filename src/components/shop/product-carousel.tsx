import { ProductCard } from "./product-card";
import type { Product } from "@/lib/test-data";

export function ProductCarousel({ title, items }: { title: string; items: Product[] }) {
  if (items.length === 0) return null;
  return (
    <section className="carousel">
      <div className="carousel-h">
        <h2>{title}</h2>
      </div>
      <div className="carousel-t">
        {items.map((p) => (
          <div className="cslide" key={p.id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
