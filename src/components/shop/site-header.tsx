"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { IconCart, IconChevronDown, IconClose, IconMenu, IconSearch } from "./icons";
import { childrenOf, topCategories } from "@/lib/test-data";

const infoNav = [
  { href: "/delivery", label: "Доставка" },
  { href: "/payment", label: "Оплата" },
  { href: "/about", label: "О магазине" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Мобильное меню: закрытие по Escape, фокус на кнопку закрытия, блок прокрутки.
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
        <div className="wrap">
          <div className="hdr-top">
            <nav className="hdr-nav">
              {infoNav.map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
            </nav>
            <div className="hdr-top-r">
              <a href="https://vk.com">РСО ВКонтакте →</a>
            </div>
          </div>

          <div className="hdr-main">
            <Link href="/" className="hdr-logo" aria-label="ТрудКрутШоп — на главную">
              <span className="logo-mask lg" />
            </Link>
            <nav className="hdr-quick">
              {topCategories.map((c) => (
                <Link key={c.slug} href={`/catalog/${c.slug}`}>{c.name}</Link>
              ))}
            </nav>
            <form action="/search" className="search" role="search">
              <IconSearch width={18} height={18} aria-hidden="true" />
              <input name="q" placeholder="Поиск по магазину" aria-label="Поиск по магазину" />
              <button type="submit" className="sr-only">Найти</button>
            </form>
            <Link href="/cart" className="cart-btn js-cart-target" aria-label={`Корзина, товаров: ${cart.count}`}>
              <IconCart width={20} height={20} />
              Корзина
              {cart.count > 0 && <span className="cart-n">{cart.count}</span>}
            </Link>
          </div>

          {/* Мобильная строка */}
          <div className="hdr-m">
            <button type="button" className="ibtn" aria-label="Открыть меню" aria-expanded={open} aria-controls="mobile-drawer" onClick={() => setOpen(true)}>
              <IconMenu />
            </button>
            <Link href="/" className="hdr-logo" aria-label="ТрудКрутШоп — на главную">
              <span className="logo-mask lg" />
            </Link>
            <Link href="/cart" className="ibtn js-cart-target" style={{ position: "relative" }} aria-label={`Корзина, товаров: ${cart.count}`}>
              <IconCart />
              {cart.count > 0 && <span className="cart-n">{cart.count}</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* Панель категорий с выпадашками */}
      <div className="catbar">
        <div className="wrap">
          <div className="catbar-in">
            {topCategories.map((c) => {
              const kids = childrenOf(c.slug);
              return (
                <div key={c.slug} className="catbar-i">
                  <Link href={`/catalog/${c.slug}`} className="catbar-a">
                    {c.name}
                    {kids.length > 0 && <IconChevronDown width={14} height={14} />}
                  </Link>
                  {kids.length > 0 && (
                    <div className="dd">
                      {kids.map((k) => (
                        <Link key={k.slug} href={`/catalog/${k.slug}`}>{k.name}</Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {open && (
        <div className="mask" onClick={() => setOpen(false)}>
          <div id="mobile-drawer" className="drawer" role="dialog" aria-modal="true" aria-label="Меню" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-h">
              <span className="hdr-logo" style={{ color: "var(--rso-blue)" }}><span className="logo-mask lg" /></span>
              <button ref={closeRef} type="button" className="ibtn" aria-label="Закрыть меню" onClick={() => setOpen(false)}>
                <IconClose />
              </button>
            </div>
            <nav className="drawer-nav">
              {topCategories.map((c) => (
                <div key={c.slug}>
                  <Link href={`/catalog/${c.slug}`} onClick={() => setOpen(false)}>{c.name}</Link>
                  {childrenOf(c.slug).length > 0 && (
                    <div className="drawer-sub">
                      {childrenOf(c.slug).map((k) => (
                        <Link key={k.slug} href={`/catalog/${k.slug}`} onClick={() => setOpen(false)}>{k.name}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="drawer-div" />
            <nav className="drawer-nav">
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
