"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Cookie-баннер (152-ФЗ / «О рекламе»): согласие сохраняется в localStorage.
const KEY = "tksh-cookie-consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* приватный режим — просто не показываем повторно */
    }
  }, []);

  if (!show) return null;

  const accept = () => {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {}
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование cookie"
      style={{
        position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 70,
        maxWidth: 720, margin: "0 auto", background: "var(--rso-black)", color: "#fff",
        borderRadius: 20, padding: "16px 20px", display: "flex", flexWrap: "wrap",
        alignItems: "center", gap: 14, boxShadow: "0 8px 40px rgba(0,0,0,.25)",
      }}
    >
      <span style={{ flex: 1, minWidth: 240, fontSize: 14, lineHeight: 1.4 }}>
        Мы используем cookie и обрабатываем персональные данные, чтобы сайт работал.
        Оставаясь здесь, вы соглашаетесь с{" "}
        <Link href="/privacy" style={{ color: "#fff", textDecoration: "underline" }}>
          политикой конфиденциальности
        </Link>.
      </span>
      <button type="button" className="btn btn-white btn-m" onClick={accept}>
        Принять
      </button>
    </div>
  );
}
