"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconArrowRight } from "./icons";

type Slide = { eyebrow: string; title: string; text: string; cta: string; href: string };

const slides: Slide[] = [
  { eyebrow: "Отрядный мерч РСО", title: "#трудкрут,\nа ты ещё круче", text: "Футболки, худи, значки и аксессуары для настоящих бойцов студотрядов.", cta: "Смотреть каталог", href: "/catalog/futbolki" },
  { eyebrow: "Коллекция 2024", title: "значки-кирпичи\nпо годам", text: "Собери свою историю отрядов — металл, эмаль, коллекционные серии.", cta: "В раздел «Значки»", href: "/catalog/znachki" },
  { eyebrow: "К сезону", title: "худи с начёсом\nи вышивкой", text: "Тёплые худи унисекс с символикой РСО. Размеры от XS до XXL.", cta: "Выбрать худи", href: "/catalog/hudi" },
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
            <div className="slider-in">
              <p className="label label-w">{s.eyebrow}</p>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              <Link href={s.href} className="btn btn-white btn-l" tabIndex={idx === i ? 0 : -1}>
                {s.cta} <IconArrowRight width={18} height={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="slider-a slider-l" aria-label="Предыдущий слайд" onClick={() => go(-1)}>
        <IconArrowLeft />
      </button>
      <button type="button" className="slider-a slider-r" aria-label="Следующий слайд" onClick={() => go(1)}>
        <IconArrowRight />
      </button>
      <div className="slider-dots">
        {slides.map((_, idx) => (
          <button key={idx} type="button" className={idx === i ? "is-on" : ""} aria-label={`Слайд ${idx + 1}`} aria-current={idx === i} onClick={() => setI(idx)} />
        ))}
      </div>
    </section>
  );
}
