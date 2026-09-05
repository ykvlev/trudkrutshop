"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Позже — отправка в Sentry.
    console.error(error);
  }, [error]);

  return (
    <div className="wrap" style={{ padding: "80px 0", textAlign: "center" }}>
      <p className="label">Что-то пошло не так</p>
      <h1 style={{ marginTop: 8 }}>Ошибка на странице</h1>
      <p className="seo" style={{ margin: "0 auto 24px" }}>
        Мы уже разбираемся. Попробуйте обновить страницу.
      </p>
      <button type="button" className="btn btn-blue btn-l" onClick={reset}>Повторить</button>
    </div>
  );
}
