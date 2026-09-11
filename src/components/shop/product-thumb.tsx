// Изображение товара. Пока нет пофотовых снимков, используем реальные
// категорийные фото (перенесены со старого сайта, public/img/categories),
// подобранные по категории товара. Для категорий без фото — тонированная
// заглушка с маской-логотипом. Имя файла = SKU заменит это на пофотовые снимки.

import Image from "next/image";

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
  src,
  className = "",
  style,
}: {
  label?: string;
  category?: string;
  src?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Приоритет: реальное фото товара → категорийное фото → тонированная заглушка.
  const url = src ?? (category && CATEGORY_IMAGE[category] ? `/img/categories/${CATEGORY_IMAGE[category]}.jpg` : undefined);

  if (url) {
    return (
      <div className={`ph ph-photo ${className}`} style={{ aspectRatio: "1", ...style }}>
        <Image src={url} alt={label} fill sizes="(max-width: 767px) 50vw, 25vw" style={{ objectFit: "cover" }} />
      </div>
    );
  }

  return (
    <div className={`ph ${className}`} style={{ aspectRatio: "1", background: tintFor(label), ...style }}>
      <span className="ph-cap">{label}</span>
    </div>
  );
}
