import localFont from "next/font/local";
import { Inter_Tight, Roboto_Mono } from "next/font/google";

// Дизайн-система (ТЗ 2026): Aspekta — единственная дисплейно-текстовая гарнитура,
// один вес 400, иерархия задаётся размером и трекингом. Замена — Inter Tight 400.
export const aspekta = Inter_Tight({
  variable: "--font-aspekta",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  display: "swap",
});

// Фирменные шрифты РСО, self-hosted через next/font/local (файлы в ./_fonts).
// Stolzl — дисплей/заголовки, Onest — текст, Actay Wide — акцентные лейблы.
// Roboto Mono — технические лейблы, навигация, счётчики секций, мета, кнопки
// (роль «приборного» моно из дизайн-системы; вес 400).

export const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  display: "swap",
});

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
