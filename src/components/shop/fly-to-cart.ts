// Анимация «улёта» товара в корзину при добавлении. Летящий клон движется
// по дуге к иконке корзины, сжимаясь и растворяясь, затем корзина «пыхает».
// Уважает prefers-reduced-motion (тогда просто пых корзины без полёта).

function cartTarget(): HTMLElement | null {
  // Берём видимую иконку корзины (десктоп или мобайл).
  const els = Array.from(document.querySelectorAll<HTMLElement>(".js-cart-target"));
  return els.find((el) => el.offsetParent !== null) ?? els[0] ?? null;
}

function popCart() {
  const t = cartTarget();
  if (!t) return;
  t.classList.remove("cart-pop");
  // reflow, чтобы анимация перезапустилась при повторном добавлении
  void t.offsetWidth;
  t.classList.add("cart-pop");
}

export function flyToCart(source: HTMLElement | null, imageSrc?: string) {
  if (typeof window === "undefined") return;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const target = cartTarget();
  if (reduce || !source || !target) {
    popCart();
    return;
  }

  const s = source.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const startX = s.left + s.width / 2;
  const startY = s.top + s.height / 2;
  const endX = t.left + t.width / 2;
  const endY = t.top + t.height / 2;

  const fly = document.createElement("div");
  fly.className = "fly-to-cart";
  if (imageSrc) {
    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = "";
    fly.appendChild(img);
  }
  Object.assign(fly.style, {
    left: `${startX}px`,
    top: `${startY}px`,
  });
  document.body.appendChild(fly);

  const dx = endX - startX;
  const dy = endY - startY;

  const anim = fly.animate(
    [
      { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0 },
      // Верхняя точка дуги.
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 80}px)) scale(0.8)`, opacity: 0.9, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.15)`, opacity: 0.2, offset: 1 },
    ],
    { duration: 650, easing: "cubic-bezier(0.5, -0.2, 0.7, 1)" },
  );

  anim.onfinish = () => {
    fly.remove();
    popCart();
  };
  anim.oncancel = () => fly.remove();
}
