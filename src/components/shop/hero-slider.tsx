"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconArrowRight } from "./icons";

type Slide = { eyebrow: string; title: string; text: string; cta: string; href: string; image: string };

// Тексты — нейтральные, без выдуманных заявлений. Заказчик заменит на свои.
// Фото — из каталога категорий (public/img/categories); заменяются на брендовые.
const slides: Slide[] = [
  { eyebrow: "Отрядный мерч РСО", title: "#трудкрут,\nа ты ещё круче", text: "Футболки, худи, значки и аксессуары.", cta: "Смотреть каталог", href: "/catalog/futbolki", image: "/img/categories/xudi.jpg" },
  { eyebrow: "Каталог", title: "Значки\nи кирпичи", text: "Эмаль, дерево, коллекционные серии.", cta: "В раздел «Значки»", href: "/catalog/znachki", image: "/img/categories/znacki.jpg" },
  { eyebrow: "Каталог", title: "Футболки\nи худи", text: "Отрядная классика на каждый день.", cta: "Выбрать одежду", href: "/catalog/hudi", image: "/img/categories/futbolki.jpg" },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  const n = slides.length;
  const go = useCallback((d: number) => setI((p) => (p + d + n) % n), [n]);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);

  return (
    <section className="slider" aria-roledescription="карусель" aria-label="Акции и коллекции">
      <div className="slider-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, idx) => (
          <div className="slide" key={idx} aria-hidden={idx !== i}>
            <div
              className="slide-bg"
              style={{ backgroundImage: `url(${s.image})` }}
              aria-hidden="true"
            />
            <div className="slider-in">
              <p className="label label-w">{s.eyebrow}</p>
              <h2>{s.title}</h2>
              {s.text && <p>{s.text}</p>}
              <Link href={s.href} className="btn btn-white btn-l" tabIndex={idx === i ? 0 : -1}>
                {s.cta} <IconArrowRight width={18} height={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="slider-nav">
        <div className="slider-nav-in">
          <div className="slider-dots">
            {slides.map((_, idx) => (
              <button key={idx} type="button" className={idx === i ? "is-on" : ""} aria-label={`Слайд ${idx + 1}`} aria-current={idx === i} onClick={() => setI(idx)} />
            ))}
          </div>
          <div className="slider-arrows">
            <button type="button" className="slider-a slider-l" aria-label="Предыдущий слайд" onClick={() => go(-1)}>
              <IconArrowLeft width={18} height={18} />
            </button>
            <button type="button" className="slider-a slider-r" aria-label="Следующий слайд" onClick={() => go(1)}>
              <IconArrowRight width={18} height={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
