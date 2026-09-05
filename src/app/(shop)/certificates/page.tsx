"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { createCertificateOrder } from "@/lib/actions";

const DESIGNS = [
  { id: "blue", name: "Синий", color: "#0804ff" },
  { id: "deep", name: "Глубокий", color: "#0040cb" },
  { id: "bright", name: "Яркий", color: "#5552ff" },
  { id: "black", name: "Чёрный", color: "#000000" },
];

const PRESETS = [500, 1000, 2000, 3000];

export default function CertificatesPage() {
  const [design, setDesign] = useState(DESIGNS[0]);
  const [amount, setAmount] = useState(1000);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [at, setAt] = useState("");
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState("");

  const addToCart = async () => {
    const res = await createCertificateOrder({
      design: design.id, amount, recipientEmail: email, recipientPhone: phone,
      sendAt: when === "later" ? at : null,
    });
    if (res.ok) { setErr(""); setAdded(true); }
    else { setAdded(false); setErr(res.error); }
  };

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <nav aria-label="Хлебные крошки" className="crumbs">
        <Link href="/">Главная</Link>
        <span className="crumbs-s">/</span>
        <span>Подарочные сертификаты</span>
      </nav>

      <p className="label">Подарок</p>
      <h1>Подарочные сертификаты</h1>
      <p className="lead">Не знаете, что подарить бойцу отряда? Сертификат ТрудКрутШоп на любую сумму — получатель выберет мерч сам.</p>

      <div className="certgrid" style={{ marginTop: 24 }}>
        <div>
          {/* Дизайн */}
          <div className="fld">
            <span className="fld-l">Дизайн</span>
            <div className="cdesigns">
              {DESIGNS.map((d) => (
                <button key={d.id} type="button" className={`cdesign${design.id === d.id ? " is-on" : ""}`} onClick={() => setDesign(d)}>
                  <span className="cdesign-sw" style={{ background: d.color }} />
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Номинал */}
          <div className="fld">
            <span className="fld-l">Номинал</span>
            <div className="chips" style={{ marginBottom: 10 }}>
              {PRESETS.map((v) => (
                <button key={v} type="button" className={`chip${amount === v ? " is-on" : ""}`} onClick={() => setAmount(v)}>
                  {formatPrice(v)}
                </button>
              ))}
            </div>
            <input type="number" inputMode="numeric" min={100} step={100} value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} aria-label="Своя сумма" />
            <span className="fld-h">Любая сумма от 100 ₽</span>
          </div>

          {/* Получатель */}
          <div className="fgrid">
            <label className="fld"><span className="fld-l">E-mail получателя</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@mail.ru" /></label>
            <label className="fld"><span className="fld-l">Телефон получателя</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" /></label>
          </div>

          {/* Когда отправить */}
          <div className="fld">
            <span className="fld-l">Когда отправить</span>
            <div className="dlist">
              <label className={`dopt${when === "now" ? " is-on" : ""}`}>
                <input type="radio" name="when" checked={when === "now"} onChange={() => setWhen("now")} />
                <span><span className="dopt-t">Сразу после оплаты</span></span>
              </label>
              <label className={`dopt${when === "later" ? " is-on" : ""}`}>
                <input type="radio" name="when" checked={when === "later"} onChange={() => setWhen("later")} />
                <span>
                  <span className="dopt-t">Запланировать</span>
                  <span className="dopt-s">
                    <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} aria-label="Дата и время отправки" />
                  </span>
                </span>
              </label>
            </div>
          </div>

          <button type="button" className="btn btn-blue btn-l" onClick={addToCart}>
            В корзину — {formatPrice(amount)}
          </button>
          {added && (
            <div className="ok" style={{ marginTop: 14 }}>
              Сертификат добавлен. Оформите его в <Link href="/cart" className="link">корзине</Link>.
            </div>
          )}
          {err && <div className="bad" style={{ marginTop: 14 }}>{err}</div>}

          <h2 style={{ margin: "32px 0 12px" }}>Как это работает</h2>
          <ol className="steps">
            <li>Выберите дизайн, номинал и укажите получателя.</li>
            <li>Оплатите — сертификат придёт на e-mail получателя в назначенное время.</li>
            <li>Получатель вводит код в корзине как способ оплаты.</li>
            <li>Поддерживается частичное погашение — остаток сохраняется на балансе.</li>
          </ol>
        </div>

        {/* Превью */}
        <div>
          <div className="cert" style={{ borderColor: design.color, color: design.color }}>
            <div className="cert-pat" />
            <div className="cert-in">
              <div>
                <div className="label" style={{ color: "inherit" }}>Подарочный сертификат</div>
                <div style={{ fontFamily: "var(--font-display)", textTransform: "lowercase", fontSize: 22 }}>трудкрутшоп</div>
              </div>
              <div className="cert-sum">{formatPrice(amount)}</div>
              <div className="cert-code">КОД: XXXX-XXXX-XXXX</div>
            </div>
          </div>
          <p className="hint">Так сертификат придёт получателю. Код подставляется после оплаты.</p>
        </div>
      </div>
    </div>
  );
}
