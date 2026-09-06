// Иконка из набора дизайн-системы РСО (Solar). Одноцветная, красится
// currentColor. Имена — см. icon-data.ts (стиль+категория+имя),
// напр. "LinearEssentionalUIDelivery". Брендбук: Linear для UI, Bold для акцентов.

import type { SVGProps } from "react";
import iconData from "./icon-data";

const icons = iconData as Record<string, { viewBox: string; body: string }>;

export type IconName = keyof typeof iconData;

export function Icon({
  name,
  size = 24,
  ...rest
}: { name: IconName | string; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  const d = icons[name as string];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox={d.viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      // body — только геометрия/заливки/трансформы из эмиттера, без пользовательского текста.
      dangerouslySetInnerHTML={{ __html: d.body }}
      {...rest}
    />
  );
}

export default Icon;
