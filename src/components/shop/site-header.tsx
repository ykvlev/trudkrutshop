"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { useCartDrawer } from "./cart-drawer";
import { IconCart, IconClose, IconMenu, IconSearch } from "./icons";

export type NavCategory = { slug: string; name: string; children: { slug: string; name: string }[] };

const infoNav = [
  { href: "/delivery", label: "Доставка" },
  { href: "/payment", label: "Оплата" },
  { href: "/about", label: "О магазине" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteHeader({ nav = [] }: { nav?: NavCategory[] }) {
  const cart = useCart();
  const drawer = useCartDrawer();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Боковое меню: Escape, фокус на закрытие, блок прокрутки.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header className="hdr">
        <div className="wrap hdr-bar">
          <button
            type="button"
            className="menu-btn"
            aria-label="Открыть каталог"
            aria-expanded={open}
            aria-controls="side-menu"
            onClick={() => setOpen(true)}
          >
            <IconMenu width={22} height={22} />
            <span className="menu-btn-t">Каталог</span>
          </button>

          <Link href="/" className="hdr-logo" aria-label="ТрудКрутШоп — на главную">
            {/* eslint-disable-next-line @next/next/no-img-element -- статичный логотип-эмблема */}
            <img src="/brand/logo-2026.svg" alt="ТрудКрут" className="hdr-logo-img" />
          </Link>

          <form action="/search" className="search" role="search">
            <IconSearch width={18} height={18} aria-hidden="true" />
            <input name="q" placeholder="Поиск" aria-label="Поиск по магазину" />
            <button type="submit" className="sr-only">Найти</button>
          </form>

          <Link href="/search" className="ibtn ibtn-search-m" aria-label="Поиск">
            <IconSearch width={20} height={20} />
          </Link>

          <button
            type="button"
            className="ibtn js-cart-target cart-icon"
            aria-label={`Корзина, товаров: ${cart.count}`}
            onClick={() => drawer.open()}
          >
            <IconCart width={22} height={22} />
            {cart.count > 0 && <span className="cart-n">{cart.count}</span>}
          </button>
        </div>
      </header>

      {open && (
        <div className="mask mask-left" onClick={() => setOpen(false)}>
          <div id="side-menu" className="drawer" role="dialog" aria-modal="true" aria-label="Каталог" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-h">
              <span className="drawer-title">Каталог</span>
              <button ref={closeRef} type="button" className="ibtn" aria-label="Закрыть меню" onClick={() => setOpen(false)}>
                <IconClose />
              </button>
            </div>

            <nav className="drawer-nav">
              {nav.map((c) => (
                <div key={c.slug} className="drawer-cat">
                  {c.children.length > 0 ? (
                    <button
                      type="button"
                      className={`drawer-cat-h${expanded === c.slug ? " is-open" : ""}`}
                      aria-expanded={expanded === c.slug}
                      onClick={() => setExpanded(expanded === c.slug ? null : c.slug)}
                    >
                      <span>{c.name}</span>
                      <span className="drawer-plus">{expanded === c.slug ? "–" : "+"}</span>
                    </button>
                  ) : (
                    <Link href={`/catalog/${c.slug}`} className="drawer-cat-h" onClick={() => setOpen(false)}>
                      <span>{c.name}</span>
                    </Link>
                  )}
                  {c.children.length > 0 && expanded === c.slug && (
                    <div className="drawer-sub">
                      <Link href={`/catalog/${c.slug}`} onClick={() => setOpen(false)}>Все · {c.name}</Link>
                      {c.children.map((k) => (
                        <Link key={k.slug} href={`/catalog/${k.slug}`} onClick={() => setOpen(false)}>{k.name}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Link href="/certificates" className="drawer-cat-h" onClick={() => setOpen(false)}>
                <span>Подарочные сертификаты</span>
              </Link>
            </nav>

            <div className="drawer-div" />
            <nav className="drawer-info">
              {infoNav.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
