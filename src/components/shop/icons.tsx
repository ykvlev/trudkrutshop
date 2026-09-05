import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconCart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" />
    <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
  </svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
);
export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const IconChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconVk = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ strokeWidth: 0, fill: "currentColor", ...p })}>
    <path d="M12.8 16.3c-5 0-8-3.5-8.1-9.3h2.5c.1 4.3 2 6.1 3.5 6.5V7h2.4v3.6c1.5-.2 3-1.8 3.6-3.6h2.4c-.4 2.2-2 3.8-3.1 4.5 1.1.6 2.9 2 3.6 4.8h-2.6c-.5-1.7-1.9-3-3.9-3.2v3.2z" />
  </svg>
);
export const IconTelegram = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ strokeWidth: 0, fill: "currentColor", ...p })}>
    <path d="M21.5 4.3 2.9 11.5c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.6c.2.7 1.1.9 1.6.3l2.5-2.6 4.7 3.5c.6.4 1.5.1 1.7-.7L23 5.6c.2-1-.7-1.7-1.5-1.3zM9.6 14.3l8-5.1c.2-.1.4.2.2.3l-6.5 6c-.2.2-.4.5-.4.8l-.2 2z" />
  </svg>
);
