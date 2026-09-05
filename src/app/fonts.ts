import localFont from "next/font/local";

// Фирменные шрифты РСО, self-hosted через next/font/local (файлы в ./_fonts).
// Stolzl — дисплей/заголовки, Onest — текст, Actay Wide — акцентные лейблы.

export const stolzl = localFont({
  variable: "--font-stolzl",
  display: "swap",
  src: [
    { path: "./_fonts/stolzl-book.otf", weight: "400", style: "normal" },
    { path: "./_fonts/stolzl-medium.otf", weight: "500", style: "normal" },
    { path: "./_fonts/stolzl-bold.otf", weight: "700", style: "normal" },
  ],
});

export const onest = localFont({
  variable: "--font-onest",
  display: "swap",
  src: [
    { path: "./_fonts/onest-regular.ttf", weight: "400", style: "normal" },
    { path: "./_fonts/onest-medium.ttf", weight: "500", style: "normal" },
    { path: "./_fonts/onest-bold.ttf", weight: "700", style: "normal" },
  ],
});

export const actay = localFont({
  variable: "--font-actay",
  display: "swap",
  src: [{ path: "./_fonts/actay-wide-bold.otf", weight: "700", style: "normal" }],
});
