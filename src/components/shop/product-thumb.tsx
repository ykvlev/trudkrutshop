// Плейсхолдер фото товара. По макету: блок .ph с маской-логотипом ТрудКрут
// и подписью. Фон слегка тонируется по названию, чтобы карточки различались,
// пока нет реальных фото (мин. 1000×1000, имя файла = SKU) — они заменят его.

// Детерминированный мягкий оттенок из строки (стабилен между рендерами).
function tintFor(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % 360;
  return `hsl(${h} 45% 94%)`;
}

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
    <div className={`ph ${className}`} style={{ aspectRatio: "1", background: tintFor(label), ...style }}>
      <span className="ph-cap">{label}</span>
    </div>
  );
}
