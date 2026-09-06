// Изображение товара. Пока нет пофотовых снимков, используем реальные
// категорийные фото (перенесены со старого сайта, public/img/categories),
// подобранные по категории товара. Для категорий без фото — тонированная
// заглушка с маской-логотипом. Имя файла = SKU заменит это на пофотовые снимки.

// Категория (leaf-слаг) → файл категорийного фото в public/img/categories.
const CATEGORY_IMAGE: Record<string, string> = {
  futbolki: "futbolki",
  hudi: "xudi",
  kirpichi: "kirpici",
  piny: "piny",
  derevyannye: "znacki",
  znachki: "znacki",
  shopery: "sumki",
  aksessuary: "sumki",
};

// Детерминированный мягкий оттенок из строки (для заглушек без фото).
function tintFor(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % 360;
  return `hsl(${h} 45% 94%)`;
}

export function ProductThumb({
  label = "фото",
  category,
  className = "",
  style,
}: {
  label?: string;
  category?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const file = category ? CATEGORY_IMAGE[category] : undefined;

  if (file) {
    return (
      <div className={`ph ph-photo ${className}`} style={{ aspectRatio: "1", ...style }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- статичные локальные фото фикс. размера */}
        <img src={`/img/categories/${file}.jpg`} alt={label} loading="lazy" />
      </div>
    );
  }

  return (
    <div className={`ph ${className}`} style={{ aspectRatio: "1", background: tintFor(label), ...style }}>
      <span className="ph-cap">{label}</span>
    </div>
  );
}
