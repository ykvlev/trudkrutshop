"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/lib/admin-auth-actions";

const initial: LoginState = {};

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAdmin, initial);

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "var(--rso-surface-muted)" }}>
      <form action={action} className="doc" style={{ width: "100%", maxWidth: 380, margin: 0 }}>
        <p className="label">Админка ТрудКрутШоп</p>
        <h1 style={{ marginBottom: 20 }}>Вход</h1>

        <label className="fld">
          <span className="fld-l">E-mail</span>
          <input name="email" type="email" autoComplete="username" placeholder="admin@trudkrutshop.ru" required />
        </label>
        <label className="fld" style={{ marginTop: 12 }}>
          <span className="fld-l">Пароль</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>

        {state.error && <p className="bad" style={{ marginTop: 12 }}>{state.error}</p>}

        <button type="submit" className="btn btn-blue btn-l" style={{ width: "100%", marginTop: 20 }} disabled={pending}>
          {pending ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
