// Плейсхолдер фото товара. По макету: серый блок .ph с маской-логотипом
// ТрудКрут и подписью. Реальные фото (мин. 1000×1000, имя файла = SKU)
// заменят его позже.

export function ProductThumb({
  label = "фото",
  className = "",
  style,
}: {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`ph ${className}`} style={{ aspectRatio: "1", ...style }}>
      <span className="ph-cap">{label}</span>
    </div>
  );
}
