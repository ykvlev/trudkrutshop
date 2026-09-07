// Динамическая OG-картинка для соцсетей (site-wide). Брендовая карточка РСО.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ТрудКрутШоп — магазин отрядного мерча РСО";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const onest = await readFile(join(process.cwd(), "src/lib/invoice/fonts/onest-bold.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0804FF",
          color: "#fff",
          padding: 80,
          fontFamily: "Onest",
        }}
      >
        <div style={{ fontSize: 40, letterSpacing: 2, opacity: 0.85 }}>ОТРЯДНЫЙ МЕРЧ РСО</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 128, lineHeight: 1 }}>ТрудКрутШоп</div>
          <div style={{ fontSize: 46, marginTop: 24, opacity: 0.9 }}>
            #трудкрут, а ты ещё круче
          </div>
        </div>
        <div style={{ fontSize: 34, opacity: 0.85 }}>
          Футболки · худи · значки · аксессуары
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Onest", data: onest, weight: 700, style: "normal" }] },
  );
}
