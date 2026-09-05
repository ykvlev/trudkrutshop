"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import {
  setOrderStatus, addStockMovement, upsertProduct, upsertPromo, upsertAdminUser,
} from "@/lib/admin-actions";

// ── Типы данных (приходят из серверной admin/page.tsx) ──────────────
export type AdminData = {
  stats: { orders: number; awaiting: number; products: number; units: number };
  orders: {
    id: string; number: string; date: string; customer: string; type: "Физлицо" | "Юрлицо";
    total: number; status: string;
    items: { name: string; qty: number; price: number }[];
    history: { at: string; text: string }[];
  }[];
  products: { id: string; name: string; category: string; sku: string; price: number; stock: number; active: boolean }[];
  variants: { id: string; sku: string; name: string }[];
  movements: { date: string; sku: string; reason: string; delta: number }[];
  promos: { id: string; code: string; type: "PERCENT" | "FIXED"; value: number; min: number | null; limit: number | null; used: number; active: boolean }[];
  certificates: { code: string; nominal: number; balance: number; status: string }[];
  categories: { slug: string; name: string; parent: string | null }[];
  users: { id: string; name: string; email: string; role: string; active: boolean }[];
};

const STATUSES: { id: string; label: string; cls: string }[] = [
  { id: "NEW_PHYSICAL", label: "Новый (физ)", cls: "badge-mute" },
  { id: "AWAITING_PAYMENT", label: "Ожидает оплаты", cls: "badge-warn" },
  { id: "PAID_PHYSICAL", label: "Оплачен", cls: "badge-ok" },
  { id: "NEW_LEGAL", label: "Новый (юр)", cls: "badge-mute" },
  { id: "PAID_LEGAL", label: "Оплачен (юр)", cls: "badge-ok" },
  { id: "SHIPPED", label: "Отправлен", cls: "badge-blue" },
  { id: "COMPLETED", label: "Выполнен", cls: "badge-ok" },
  { id: "CANCELLED", label: "Отменён", cls: "badge-alert" },
  { id: "ARCHIVED", label: "Архив", cls: "badge-mute" },
];
const statusOf = (id: string) => STATUSES.find((s) => s.id === id) ?? { label: id, cls: "badge-mute" };

const NAV = [
  { id: "overview", label: "Обзор" }, { id: "orders", label: "Заказы" },
  { id: "products", label: "Товары" }, { id: "stock", label: "Склад" },
  { id: "certificates", label: "Сертификаты" }, { id: "promo", label: "Промокоды" },
  { id: "categories", label: "Разделы" }, { id: "users", label: "Пользователи" },
] as const;
type Section = (typeof NAV)[number]["id"];

const plural = (n: number, a: string, b: string, c: string) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return a;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return b;
  return c;
};

export function AdminApp({ data }: { data: AdminData }) {
  const [section, setSection] = useState<Section>("overview");
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(async () => { await fn(); router.refresh(); });

  return (
    <div className="admin">
      <div className="ahdr">
        <div className="ahdr-l">
          <span className="hdr-logo" style={{ color: "var(--rso-blue)" }}><span className="logo-mask sm" /></span>
          Админка{pending && <span className="ahdr-u"> · сохранение…</span>}
        </div>
        <div className="ahdr-r">
          <span className="ahdr-u">Администратор</span>
          <Link href="/" className="btn btn-ghost btn-s">На витрину</Link>
        </div>
      </div>

      <div className="abody">
        <nav className="anav">
          {NAV.map((n) => (
            <button key={n.id} type="button" className={section === n.id ? "is-on" : ""} onClick={() => setSection(n.id)}>{n.label}</button>
          ))}
        </nav>
        <div className="amain">
          {section === "overview" && <Overview data={data} />}
          {section === "orders" && <Orders data={data} run={run} />}
          {section === "products" && <Products data={data} run={run} />}
          {section === "stock" && <Stock data={data} run={run} />}
          {section === "certificates" && <Certificates data={data} />}
          {section === "promo" && <Promos data={data} run={run} />}
          {section === "categories" && <Categories data={data} />}
          {section === "users" && <Users data={data} run={run} />}
        </div>
      </div>
    </div>
  );
}

type RunFn = (fn: () => Promise<void>) => void;

function Overview({ data }: { data: AdminData }) {
  const tiles = [
    { k: "Заказов всего", v: data.stats.orders },
    { k: "Ожидают оплаты", v: data.stats.awaiting },
    { k: "Товаров", v: data.stats.products },
    { k: "Единиц на складе", v: data.stats.units },
  ];
  return (
    <>
      <div className="sec-h"><div><p className="label">Панель</p><h2>Обзор</h2></div></div>
      <div className="qa">
        {tiles.map((t) => (
          <div className="qa-i" key={t.k}>
            <p className="label" style={{ marginBottom: 6 }}>{t.k}</p>
            <div className="num" style={{ fontSize: 34 }}>{t.v}</div>
          </div>
        ))}
      </div>
      <p className="hint">Данные из Postgres.</p>
    </>
  );
}

function Orders({ data, run }: { data: AdminData; run: RunFn }) {
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered = data.orders.filter((o) =>
    (st === "" || o.status === st) && (q === "" || `${o.number} ${o.customer}`.toLowerCase().includes(q.toLowerCase())));
  const open = data.orders.find((o) => o.id === openId) ?? null;

  return (
    <>
      <div className="sec-h"><div><p className="label">Продажи</p><h2>Заказы</h2></div></div>
      <div className="afilters">
        <input placeholder="Поиск по номеру или клиенту" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="">Все статусы</option>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <table className="atable">
        <thead><tr><th>Номер</th><th>Дата</th><th>Клиент</th><th>Тип</th><th>Сумма</th><th>Статус</th></tr></thead>
        <tbody>
          {filtered.map((o) => (
            <tr key={o.id} onClick={() => setOpenId(o.id)}>
              <td><b>{o.number}</b></td><td>{o.date}</td><td>{o.customer}</td><td>{o.type}</td>
              <td className="num">{formatPrice(o.total)}</td>
              <td><span className={`badge ${statusOf(o.status).cls}`}>{statusOf(o.status).label}</span></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} style={{ color: "var(--rso-text-muted)" }}>Ничего не найдено</td></tr>}
        </tbody>
      </table>

      {open && (
        <Modal wide title={`Заказ ${open.number}`} onClose={() => setOpenId(null)}>
          <div className="acols">
            <div>
              <div className="abox">
                <div className="abox-h">Состав</div>
                <table className="atable"><tbody>
                  {open.items.map((it, i) => (
                    <tr key={i}><td>{it.name}</td><td className="num">{it.qty} шт.</td><td className="num">{formatPrice(it.price * it.qty)}</td></tr>
                  ))}
                  <tr><td><b>Итого</b></td><td></td><td className="num"><b>{formatPrice(open.total)}</b></td></tr>
                </tbody></table>
              </div>
              <div className="abox">
                <div className="abox-h">История</div>
                <ul className="hist">{open.history.map((h, i) => (<li key={i}><span className="hist-w">{h.at}</span><span>{h.text}</span></li>))}</ul>
              </div>
            </div>
            <div>
              <div className="abox">
                <div className="abox-h">Клиент</div>
                <dl className="kv"><dt>Имя</dt><dd>{open.customer}</dd><dt>Тип</dt><dd>{open.type}</dd><dt>Дата</dt><dd>{open.date}</dd></dl>
              </div>
              <div className="abox">
                <div className="abox-h">Статус</div>
                <label className="fld">
                  <select value={open.status} onChange={(e) => run(() => setOrderStatus(open.id, e.target.value as never))}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>
                <p className="hint">Смена статуса пишется в историю. «Отправлен» списывает товар со склада.</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Products({ data, run }: { data: AdminData; run: RunFn }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [edit, setEdit] = useState<AdminData["products"][number] | "new" | null>(null);
  const filtered = data.products.filter((r) =>
    (cat === "" || r.category === cat) && (q === "" || `${r.name} ${r.sku}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <div className="sec-h"><div><p className="label">Каталог</p><h2>Товары</h2></div>
        <button type="button" className="btn btn-blue btn-m" onClick={() => setEdit("new")}>Добавить товар</button></div>
      <div className="afilters">
        <input placeholder="Поиск по названию или SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Все разделы</option>
          {data.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      <table className="atable">
        <thead><tr><th>Товар</th><th>SKU</th><th>Цена</th><th>Остаток</th><th>Статус</th></tr></thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} onClick={() => setEdit(r)}>
              <td><b>{r.name}</b></td><td>{r.sku}</td><td className="num">{formatPrice(r.price)}</td>
              <td className={`num ${r.stock === 0 ? "is-minus" : ""}`}>{r.stock} шт.</td>
              <td><span className={`badge ${!r.active ? "badge-mute" : r.stock === 0 ? "badge-alert" : "badge-ok"}`}>{!r.active ? "Скрыт" : r.stock === 0 ? "Нет" : "В наличии"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <EditProduct row={edit === "new" ? null : edit} cats={data.categories} onClose={() => setEdit(null)} run={run} />}
    </>
  );
}

function EditProduct({ row, cats, onClose, run }: {
  row: AdminData["products"][number] | null;
  cats: AdminData["categories"]; onClose: () => void; run: RunFn;
}) {
  const [name, setName] = useState(row?.name ?? "");
  const [category, setCategory] = useState(row?.category ?? cats.find((c) => c.parent)?.slug ?? cats[0]?.slug ?? "");
  const [price, setPrice] = useState(row?.price ?? 0);
  const [active, setActive] = useState(row?.active ?? true);
  const save = () => { run(() => upsertProduct({ id: row?.id, name, categorySlug: category, price, isActive: active })); onClose(); };
  return (
    <Modal title={row ? "Товар" : "Новый товар"} onClose={onClose}>
      <label className="fld"><span className="fld-l">Название</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="fgrid">
        <label className="fld"><span className="fld-l">Раздел</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
        <label className="fld"><span className="fld-l">Цена, ₽</span><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></label>
      </div>
      <label className="dopt" style={{ marginBottom: 16 }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span><span className="dopt-t">Показывать в каталоге</span></span></label>
      <button type="button" className="btn btn-blue btn-l" disabled={!name} onClick={save}>Сохранить</button>
    </Modal>
  );
}

function Stock({ data, run }: { data: AdminData; run: RunFn }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="sec-h"><div><p className="label">Склад</p><h2>Журнал движений</h2></div>
        <button type="button" className="btn btn-blue btn-m" onClick={() => setOpen(true)}>Списание / приёмка</button></div>
      <p className="hint" style={{ marginBottom: 16 }}>Остаток меняется только через журнал: каждая строка — движение с причиной.</p>
      <table className="atable">
        <thead><tr><th>Дата</th><th>SKU</th><th>Причина</th><th>Изменение</th></tr></thead>
        <tbody>
          {data.movements.map((m, i) => (
            <tr key={i}><td>{m.date}</td><td>{m.sku}</td><td>{m.reason}</td>
              <td className={`num ${m.delta < 0 ? "is-minus" : "is-plus"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td></tr>
          ))}
        </tbody>
      </table>
      {open && <StockForm variants={data.variants} onClose={() => setOpen(false)} run={run} />}
    </>
  );
}

function StockForm({ variants, onClose, run }: { variants: AdminData["variants"]; onClose: () => void; run: RunFn }) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [reason, setReason] = useState("RECEIPT");
  const [qty, setQty] = useState(1);
  const OUT = ["WRITE_OFF_DEFECT", "WRITE_OFF_GIFT", "OFFLINE_SALE"];
  const outgoing = OUT.includes(reason);
  const REASONS = [
    { id: "RECEIPT", label: "Приёмка" }, { id: "RETURN", label: "Возврат на склад" },
    { id: "WRITE_OFF_DEFECT", label: "Списание (брак)" }, { id: "WRITE_OFF_GIFT", label: "Списание (подарок)" },
    { id: "OFFLINE_SALE", label: "Продажа офлайн (касса)" },
  ];
  const submit = () => {
    run(() => addStockMovement({ variantId, delta: outgoing ? -qty : qty, reason: reason as never }));
    onClose();
  };
  return (
    <Modal title="Движение по складу" onClose={onClose}>
      <div className="fgrid">
        <label className="fld"><span className="fld-l">Товар (SKU)</span>
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)}>{variants.map((v) => <option key={v.id} value={v.id}>{v.sku} — {v.name}</option>)}</select></label>
        <label className="fld"><span className="fld-l">Причина</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
        <label className="fld"><span className="fld-l">Количество</span><input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} /></label>
      </div>
      <p className="hint">{outgoing ? "Расход: остаток уменьшится" : "Приход: остаток увеличится"}</p>
      <button type="button" className="btn btn-blue btn-l" disabled={!variantId} onClick={submit}>Провести</button>
    </Modal>
  );
}

function Certificates({ data }: { data: AdminData }) {
  return (
    <>
      <div className="sec-h"><div><p className="label">Маркетинг</p><h2>Сертификаты</h2></div></div>
      <table className="atable">
        <thead><tr><th>Код</th><th>Номинал</th><th>Остаток</th><th>Статус</th></tr></thead>
        <tbody>
          {data.certificates.map((r) => (
            <tr key={r.code}><td><b>{r.code}</b></td><td className="num">{formatPrice(r.nominal)}</td>
              <td className="num">{formatPrice(r.balance)}</td><td><span className="badge badge-mute">{r.status}</span></td></tr>
          ))}
          {data.certificates.length === 0 && <tr><td colSpan={4} style={{ color: "var(--rso-text-muted)" }}>Пока нет сертификатов</td></tr>}
        </tbody>
      </table>
    </>
  );
}

function Promos({ data, run }: { data: AdminData; run: RunFn }) {
  const [edit, setEdit] = useState<AdminData["promos"][number] | "new" | null>(null);
  return (
    <>
      <div className="sec-h"><div><p className="label">Маркетинг</p><h2>Промокоды</h2></div>
        <button type="button" className="btn btn-blue btn-m" onClick={() => setEdit("new")}>Добавить промокод</button></div>
      <table className="atable">
        <thead><tr><th>Код</th><th>Скидка</th><th>Мин. сумма</th><th>Использований</th><th>Статус</th></tr></thead>
        <tbody>
          {data.promos.map((p) => (
            <tr key={p.id} onClick={() => setEdit(p)}>
              <td><b>{p.code}</b></td><td>{p.type === "PERCENT" ? `${p.value}%` : formatPrice(p.value)}</td>
              <td>{p.min ? formatPrice(p.min) : "—"}</td><td>{p.used}{p.limit ? ` / ${p.limit}` : ""}</td>
              <td><span className={`badge ${p.active ? "badge-ok" : "badge-mute"}`}>{p.active ? "Активен" : "Выключен"}</span></td>
            </tr>
          ))}
          {data.promos.length === 0 && <tr><td colSpan={5} style={{ color: "var(--rso-text-muted)" }}>Пока нет промокодов</td></tr>}
        </tbody>
      </table>
      {edit && <EditPromo promo={edit === "new" ? null : edit} onClose={() => setEdit(null)} run={run} />}
    </>
  );
}

function EditPromo({ promo, onClose, run }: { promo: AdminData["promos"][number] | null; onClose: () => void; run: RunFn }) {
  const [code, setCode] = useState(promo?.code ?? "");
  const [type, setType] = useState<"PERCENT" | "FIXED">(promo?.type ?? "PERCENT");
  const [value, setValue] = useState(promo?.value ?? 10);
  const [min, setMin] = useState(promo?.min ?? 0);
  const [limit, setLimit] = useState(promo?.limit ?? 0);
  const [active, setActive] = useState(promo?.active ?? true);
  const save = () => {
    run(() => upsertPromo({ code: code.toUpperCase(), type, value, minAmount: min || null, usageLimit: limit || null, isActive: active }));
    onClose();
  };
  return (
    <Modal title={promo ? "Промокод" : "Новый промокод"} onClose={onClose}>
      <label className="fld"><span className="fld-l">Код</span><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} disabled={!!promo} /></label>
      <div className="fgrid">
        <label className="fld"><span className="fld-l">Тип</span>
          <select value={type} onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}><option value="PERCENT">Процент</option><option value="FIXED">Фикс. сумма</option></select></label>
        <label className="fld"><span className="fld-l">Значение</span><input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} /></label>
        <label className="fld"><span className="fld-l">Мин. сумма, ₽</span><input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} /></label>
        <label className="fld"><span className="fld-l">Лимит (0 — без)</span><input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></label>
      </div>
      <label className="dopt" style={{ marginBottom: 16 }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span><span className="dopt-t">Активен</span></span></label>
      <button type="button" className="btn btn-blue btn-l" disabled={!code} onClick={save}>Сохранить</button>
    </Modal>
  );
}

function Categories({ data }: { data: AdminData }) {
  const roots = data.categories.filter((c) => !c.parent);
  return (
    <>
      <div className="sec-h"><div><p className="label">Каталог</p><h2>Разделы</h2></div></div>
      <div className="abox">
        {roots.map((r) => (
          <div key={r.slug} style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: "var(--font-core)", padding: "6px 0" }}>{r.name} <span className="hist-w">/{r.slug}</span></div>
            <div style={{ paddingLeft: 20, borderLeft: "1px solid var(--rso-border-faint)", marginLeft: 8 }}>
              {data.categories.filter((c) => c.parent === r.slug).map((k) => (
                <div key={k.slug} style={{ padding: "6px 0", color: "var(--rso-text-muted)" }}>{k.name} <span className="hist-w">/{k.slug}</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Users({ data, run }: { data: AdminData; run: RunFn }) {
  const [edit, setEdit] = useState<AdminData["users"][number] | "new" | null>(null);
  return (
    <>
      <div className="sec-h"><div><p className="label">Доступ</p><h2>Пользователи</h2></div>
        <button type="button" className="btn btn-blue btn-m" onClick={() => setEdit("new")}>Добавить сотрудника</button></div>
      <table className="atable">
        <thead><tr><th>Имя</th><th>E-mail</th><th>Роль</th><th>Статус</th></tr></thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u.id} onClick={() => setEdit(u)}>
              <td><b>{u.name}</b></td><td>{u.email}</td><td>{roleLabel(u.role)}</td>
              <td><span className={`badge ${u.active ? "badge-ok" : "badge-mute"}`}>{u.active ? "Активен" : "Отключён"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <EditUser user={edit === "new" ? null : edit} onClose={() => setEdit(null)} run={run} />}
    </>
  );
}

const roleLabel = (r: string) => ({ ADMIN: "Администратор", MANAGER: "Менеджер", CONTENT: "Контент-менеджер" }[r] ?? r);

function EditUser({ user, onClose, run }: { user: AdminData["users"][number] | null; onClose: () => void; run: RunFn }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? "MANAGER");
  const [active, setActive] = useState(user?.active ?? true);
  const save = () => { run(() => upsertAdminUser({ id: user?.id, name, email, role: role as never, isActive: active })); onClose(); };
  return (
    <Modal title={user ? "Сотрудник" : "Новый сотрудник"} onClose={onClose}>
      <div className="fgrid">
        <label className="fld"><span className="fld-l">Имя</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="fld"><span className="fld-l">E-mail</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      </div>
      <label className="fld"><span className="fld-l">Роль</span>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="ADMIN">Администратор</option><option value="MANAGER">Менеджер</option><option value="CONTENT">Контент-менеджер</option>
        </select></label>
      <label className="dopt" style={{ marginBottom: 16 }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span><span className="dopt-t">Доступ включён</span></span></label>
      {!user && <p className="hint" style={{ marginBottom: 12 }}>Временный пароль: <b>changeme</b> — сотрудник меняет при первом входе.</p>}
      <button type="button" className="btn btn-blue btn-l" disabled={!name || !email} onClick={save}>Сохранить</button>
    </Modal>
  );
}

function Modal({ title, wide, onClose, children }: { title: string; wide?: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="mask" onClick={onClose}>
      <div className={`modal${wide ? " is-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h"><h3>{title}</h3><button type="button" className="btn btn-ghost btn-s" onClick={onClose}>Закрыть</button></div>
        {children}
      </div>
    </div>
  );
}
