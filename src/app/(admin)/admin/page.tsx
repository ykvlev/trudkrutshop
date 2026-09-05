"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { products as seedProducts, totalStock, categories, childrenOf, type Product } from "@/lib/test-data";
import { pages as staticPages } from "@/lib/pages";
import { formatPrice } from "@/lib/format";

const NAV = [
  { id: "overview", label: "Обзор" },
  { id: "orders", label: "Заказы" },
  { id: "products", label: "Товары" },
  { id: "stock", label: "Склад" },
  { id: "certificates", label: "Сертификаты" },
  { id: "promo", label: "Промокоды" },
  { id: "categories", label: "Разделы" },
  { id: "pages", label: "Страницы" },
  { id: "users", label: "Пользователи" },
] as const;
type Section = (typeof NAV)[number]["id"];

const STATUSES = [
  { id: "awaiting", label: "Ожидает оплаты", cls: "badge-warn" },
  { id: "paid", label: "Оплачен", cls: "badge-ok" },
  { id: "legal_invoice", label: "Счёт выставлен", cls: "badge-mute" },
  { id: "shipped", label: "Отправлен", cls: "badge-blue" },
  { id: "done", label: "Выполнен", cls: "badge-ok" },
  { id: "cancelled", label: "Отменён", cls: "badge-alert" },
] as const;
type StatusId = (typeof STATUSES)[number]["id"];
const statusOf = (id: StatusId) => STATUSES.find((s) => s.id === id)!;

type OrderItem = { name: string; qty: number; price: number };
type Hist = { at: string; text: string };
type Order = {
  num: string; date: string; customer: string; type: "Физлицо" | "Юрлицо";
  status: StatusId; items: OrderItem[]; history: Hist[];
};
type Row = { id: string; name: string; category: string; sku: string; price: number; stock: number; active: boolean };
type Movement = { date: string; sku: string; reason: string; delta: number };

const now = () => new Date().toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const total = (items: OrderItem[]) => items.reduce((s, i) => s + i.price * i.qty, 0);

const SEED_ORDERS: Order[] = [
  { num: "ТКШ-001042", date: "05.09.2026", customer: "Иван Петров", type: "Физлицо", status: "paid",
    items: [{ name: "Худи «РСО» серый, начёс", qty: 1, price: 3450 }, { name: "Пин «ТрудКрут»", qty: 1, price: 250 }, { name: "Футболка «РСО» белая", qty: 1, price: 1290 }],
    history: [{ at: "05.09 12:01", text: "Заказ создан" }, { at: "05.09 12:04", text: "Статус → Оплачен" }] },
  { num: "ТКШ-001041", date: "05.09.2026", customer: "Мария Соколова", type: "Физлицо", status: "awaiting",
    items: [{ name: "Футболка «РСО» белая", qty: 1, price: 1290 }], history: [{ at: "05.09 11:30", text: "Заказ создан" }] },
  { num: "ТКШ-001040", date: "04.09.2026", customer: "АНО «РСО-РАЗВИТИЕ»", type: "Юрлицо", status: "legal_invoice",
    items: [{ name: "Худи «ТрудКрут» синий", qty: 6, price: 3650 }, { name: "Кирпич 2024", qty: 15, price: 220 }],
    history: [{ at: "04.09 15:10", text: "Заказ создан" }, { at: "04.09 15:12", text: "Счёт выставлен" }] },
  { num: "ТКШ-001039", date: "04.09.2026", customer: "Алексей Кузнецов", type: "Физлицо", status: "shipped",
    items: [{ name: "Худи «РСО» серый, начёс", qty: 1, price: 3450 }],
    history: [{ at: "04.09 09:00", text: "Заказ создан" }, { at: "04.09 09:05", text: "Статус → Оплачен" }, { at: "04.09 16:20", text: "Статус → Отправлен" }] },
];

const toRow = (p: Product): Row => ({
  id: p.id, name: p.name, category: p.category, sku: p.variants[0]?.sku ?? p.slug, price: p.price, stock: totalStock(p), active: true,
});

export default function AdminPage() {
  const [section, setSection] = useState<Section>("overview");
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [rows, setRows] = useState<Row[]>(seedProducts.map(toRow));
  const [movements, setMovements] = useState<Movement[]>([
    { date: "05.09 14:20", sku: "HD-RSO-GR-M", reason: "Продажа онлайн", delta: -1 },
    { date: "05.09 12:00", sku: "FB-RSO-WH-S", reason: "Приёмка", delta: 20 },
    { date: "04.09 18:30", sku: "PN-TK", reason: "Списание (подарок)", delta: -3 },
  ]);

  return (
    <div className="admin">
      <div className="ahdr">
        <div className="ahdr-l">
          <span className="hdr-logo" style={{ color: "var(--rso-blue)" }}><span className="logo-mask sm" /></span>
          Админка
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
          {section === "overview" && <Overview orders={orders} rows={rows} />}
          {section === "orders" && <Orders orders={orders} setOrders={setOrders} />}
          {section === "products" && <Products rows={rows} setRows={setRows} />}
          {section === "stock" && <Stock movements={movements} setMovements={setMovements} rows={rows} setRows={setRows} />}
          {section === "certificates" && <Certificates />}
          {section === "promo" && <Promos />}
          {section === "categories" && <Categories />}
          {section === "pages" && <Pages />}
          {section === "users" && <Users />}
        </div>
      </div>
    </div>
  );
}

function Overview({ orders, rows }: { orders: Order[]; rows: Row[] }) {
  const awaiting = orders.filter((o) => o.status === "awaiting").length;
  const units = rows.reduce((s, r) => s + r.stock, 0);
  const tiles = [
    { k: "Заказов всего", v: String(orders.length) },
    { k: "Ожидают оплаты", v: String(awaiting) },
    { k: "Товаров в каталоге", v: String(rows.length) },
    { k: "Единиц на складе", v: String(units) },
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
      <p className="hint">Данные в сессии. После подключения БД — реальные показатели и период.</p>
    </>
  );
}

function Orders({ orders, setOrders }: { orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>> }) {
  const [q, setQ] = useState("");
  const [st, setSt] = useState<StatusId | "">("");
  const [openNum, setOpenNum] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = orders.filter((o) =>
    (st === "" || o.status === st) &&
    (q === "" || `${o.num} ${o.customer}`.toLowerCase().includes(q.toLowerCase())));

  const open = orders.find((o) => o.num === openNum) ?? null;

  const changeStatus = (num: string, next: StatusId) =>
    setOrders((prev) => prev.map((o) => o.num === num
      ? { ...o, status: next, history: [...o.history, { at: now(), text: `Статус → ${statusOf(next).label}` }] }
      : o));

  const createOrder = (o: Order) => { setOrders((prev) => [o, ...prev]); setCreating(false); };

  return (
    <>
      <div className="sec-h"><div><p className="label">Продажи</p><h2>Заказы</h2></div>
        <button type="button" className="btn btn-blue btn-m" onClick={() => setCreating(true)}>Создать заказ</button></div>
      <div className="afilters">
        <input placeholder="Поиск по номеру или клиенту" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={st} onChange={(e) => setSt(e.target.value as StatusId | "")}>
          <option value="">Все статусы</option>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <table className="atable">
        <thead><tr><th>Номер</th><th>Дата</th><th>Клиент</th><th>Тип</th><th>Сумма</th><th>Статус</th></tr></thead>
        <tbody>
          {filtered.map((o) => (
            <tr key={o.num} onClick={() => setOpenNum(o.num)}>
              <td><b>{o.num}</b></td><td>{o.date}</td><td>{o.customer}</td><td>{o.type}</td>
              <td className="num">{formatPrice(total(o.items))}</td>
              <td><span className={`badge ${statusOf(o.status).cls}`}>{statusOf(o.status).label}</span></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} style={{ color: "var(--rso-text-muted)" }}>Ничего не найдено</td></tr>}
        </tbody>
      </table>

      {open && (
        <Modal wide title={`Заказ ${open.num}`} onClose={() => setOpenNum(null)}>
          <div className="acols">
            <div>
              <div className="abox">
                <div className="abox-h">Состав</div>
                <table className="atable">
                  <tbody>
                    {open.items.map((it, i) => (
                      <tr key={i}><td>{it.name}</td><td className="num">{it.qty} шт.</td><td className="num">{formatPrice(it.price * it.qty)}</td></tr>
                    ))}
                    <tr><td><b>Итого</b></td><td></td><td className="num"><b>{formatPrice(total(open.items))}</b></td></tr>
                  </tbody>
                </table>
              </div>
              <div className="abox">
                <div className="abox-h">История</div>
                <ul className="hist">
                  {open.history.map((h, i) => (<li key={i}><span className="hist-w">{h.at}</span><span>{h.text}</span></li>))}
                </ul>
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
                  <select value={open.status} onChange={(e) => changeStatus(open.num, e.target.value as StatusId)}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>
                <p className="hint">Смена статуса записывается в историю. «Отправлен» списывает товар со склада.</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {creating && <CreateOrder onClose={() => setCreating(false)} onCreate={createOrder} />}
    </>
  );
}

function CreateOrder({ onClose, onCreate }: { onClose: () => void; onCreate: (o: Order) => void }) {
  const [customer, setCustomer] = useState("");
  const [type, setType] = useState<"Физлицо" | "Юрлицо">("Физлицо");
  const [pid, setPid] = useState(seedProducts[0].id);
  const [qty, setQty] = useState(1);

  const submit = () => {
    const p = seedProducts.find((x) => x.id === pid)!;
    const num = "ТКШ-" + String(Date.now()).slice(-6);
    onCreate({
      num, date: new Date().toLocaleDateString("ru-RU"), customer: customer || "Без имени", type,
      status: type === "Юрлицо" ? "legal_invoice" : "awaiting",
      items: [{ name: p.name, qty, price: p.price }],
      history: [{ at: now(), text: "Заказ создан менеджером" }],
    });
  };

  return (
    <Modal title="Новый заказ" onClose={onClose}>
      <label className="fld"><span className="fld-l">Клиент</span><input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Имя или организация" /></label>
      <label className="fld"><span className="fld-l">Тип</span>
        <select value={type} onChange={(e) => setType(e.target.value as "Физлицо" | "Юрлицо")}><option>Физлицо</option><option>Юрлицо</option></select></label>
      <div className="fgrid">
        <label className="fld"><span className="fld-l">Товар</span>
          <select value={pid} onChange={(e) => setPid(e.target.value)}>{seedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="fld"><span className="fld-l">Количество</span><input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} /></label>
      </div>
      <button type="button" className="btn btn-blue btn-l" onClick={submit}>Создать заказ</button>
    </Modal>
  );
}

function Products({ rows, setRows }: { rows: Row[]; setRows: React.Dispatch<React.SetStateAction<Row[]>> }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [edit, setEdit] = useState<Row | "new" | null>(null);

  const cats = categories.filter((c) => !c.parent);
  const filtered = rows.filter((r) =>
    (cat === "" || r.category === cat) &&
    (q === "" || `${r.name} ${r.sku}`.toLowerCase().includes(q.toLowerCase())));

  const save = (r: Row) => {
    setRows((prev) => prev.some((x) => x.id === r.id) ? prev.map((x) => x.id === r.id ? r : x) : [r, ...prev]);
    setEdit(null);
  };

  return (
    <>
      <div className="sec-h"><div><p className="label">Каталог</p><h2>Товары</h2></div>
        <button type="button" className="btn btn-blue btn-m" onClick={() => setEdit("new")}>Добавить товар</button></div>
      <div className="afilters">
        <input placeholder="Поиск по названию или SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Все разделы</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <button type="button" className="btn btn-ghost btn-m">Импорт из Excel</button>
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
      {edit && <EditProduct row={edit === "new" ? null : edit} cats={cats} onClose={() => setEdit(null)} onSave={save} />}
    </>
  );
}

function EditProduct({ row, cats, onClose, onSave }: { row: Row | null; cats: { slug: string; name: string }[]; onClose: () => void; onSave: (r: Row) => void }) {
  const [name, setName] = useState(row?.name ?? "");
  const [category, setCategory] = useState(row?.category ?? cats[0]?.slug ?? "");
  const [sku, setSku] = useState(row?.sku ?? "");
  const [price, setPrice] = useState(row?.price ?? 0);
  const [stock, setStock] = useState(row?.stock ?? 0);
  const [active, setActive] = useState(row?.active ?? true);

  return (
    <Modal title={row ? "Редактирование товара" : "Новый товар"} onClose={onClose}>
      <label className="fld"><span className="fld-l">Название</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="fgrid">
        <label className="fld"><span className="fld-l">Раздел</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
        <label className="fld"><span className="fld-l">SKU</span><input value={sku} onChange={(e) => setSku(e.target.value)} /></label>
        <label className="fld"><span className="fld-l">Цена, ₽</span><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></label>
        <label className="fld"><span className="fld-l">Остаток</span><input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} /></label>
      </div>
      <label className="dopt" style={{ marginBottom: 16 }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <span><span className="dopt-t">Показывать в каталоге</span></span>
      </label>
      <button type="button" className="btn btn-blue btn-l" onClick={() => onSave({ id: row?.id ?? "p-" + Date.now(), name, category, sku, price, stock, active })}>Сохранить</button>
    </Modal>
  );
}

function Stock({ movements, setMovements, rows, setRows }: {
  movements: Movement[]; setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  rows: Row[]; setRows: React.Dispatch<React.SetStateAction<Row[]>>;
}) {
  const [open, setOpen] = useState(false);

  const add = (m: Movement) => {
    setMovements((prev) => [m, ...prev]);
    // Остаток меняется через журнал: подправим агрегат товара с этим SKU.
    setRows((prev) => prev.map((r) => r.sku === m.sku ? { ...r, stock: Math.max(0, r.stock + m.delta) } : r));
    setOpen(false);
  };

  return (
    <>
      <div className="sec-h"><div><p className="label">Склад</p><h2>Журнал движений</h2></div>
        <button type="button" className="btn btn-blue btn-m" onClick={() => setOpen(true)}>Списание / приёмка</button></div>
      <p className="hint" style={{ marginBottom: 16 }}>Остаток меняется только через журнал: каждая строка — движение с причиной.</p>
      <table className="atable">
        <thead><tr><th>Дата</th><th>SKU</th><th>Причина</th><th>Изменение</th></tr></thead>
        <tbody>
          {movements.map((m, i) => (
            <tr key={i}><td>{m.date}</td><td>{m.sku}</td><td>{m.reason}</td>
              <td className={`num ${m.delta < 0 ? "is-minus" : "is-plus"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td></tr>
          ))}
        </tbody>
      </table>
      {open && <StockForm rows={rows} onClose={() => setOpen(false)} onAdd={add} />}
    </>
  );
}

function StockForm({ rows, onClose, onAdd }: { rows: Row[]; onClose: () => void; onAdd: (m: Movement) => void }) {
  const [sku, setSku] = useState(rows[0]?.sku ?? "");
  const [reason, setReason] = useState("Приёмка");
  const [qty, setQty] = useState(1);
  const outgoing = reason.includes("Списание") || reason.includes("Продажа");

  return (
    <Modal title="Движение по складу" onClose={onClose}>
      <div className="fgrid">
        <label className="fld"><span className="fld-l">Товар (SKU)</span>
          <select value={sku} onChange={(e) => setSku(e.target.value)}>{rows.map((r) => <option key={r.id} value={r.sku}>{r.sku} — {r.name}</option>)}</select></label>
        <label className="fld"><span className="fld-l">Причина</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>Приёмка</option><option>Возврат на склад</option>
            <option>Списание (брак)</option><option>Списание (подарок)</option><option>Продажа офлайн (касса)</option>
          </select></label>
        <label className="fld"><span className="fld-l">Количество</span><input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} /></label>
      </div>
      <p className="hint">{outgoing ? "Расход: остаток уменьшится" : "Приход: остаток увеличится"}</p>
      <button type="button" className="btn btn-blue btn-l" onClick={() => onAdd({ date: now(), sku, reason, delta: outgoing ? -qty : qty })}>Провести</button>
    </Modal>
  );
}

function Certificates() {
  const rows = [
    { code: "RSO-4821-9034", nominal: 2000, balance: 2000, status: "Активен", cls: "badge-ok" },
    { code: "RSO-1190-5522", nominal: 1000, balance: 300, status: "Частично", cls: "badge-warn" },
    { code: "RSO-7731-2048", nominal: 3000, balance: 0, status: "Погашен", cls: "badge-mute" },
  ];
  return (
    <>
      <div className="sec-h"><div><p className="label">Маркетинг</p><h2>Сертификаты</h2></div>
        <button type="button" className="btn btn-blue btn-m">Создать вручную</button></div>
      <table className="atable">
        <thead><tr><th>Код</th><th>Номинал</th><th>Остаток</th><th>Статус</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code}><td><b>{r.code}</b></td><td className="num">{formatPrice(r.nominal)}</td>
              <td className="num">{formatPrice(r.balance)}</td><td><span className={`badge ${r.cls}`}>{r.status}</span></td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ─── Промокоды ───────────────────────────────────────────────────
type Promo = { code: string; type: "%" | "₽"; value: number; min: number; limit: number; used: number; active: boolean };
function Promos() {
  const [list, setList] = useState<Promo[]>([
    { code: "РСО10", type: "%", value: 10, min: 0, limit: 0, used: 34, active: true },
    { code: "ТРУДКРУТ", type: "₽", value: 300, min: 1000, limit: 100, used: 12, active: true },
    { code: "ЛЕТО2025", type: "%", value: 15, min: 2000, limit: 50, used: 50, active: false },
  ]);
  const [edit, setEdit] = useState<Promo | "new" | null>(null);
  const save = (p: Promo) => {
    setList((prev) => prev.some((x) => x.code === p.code) ? prev.map((x) => x.code === p.code ? p : x) : [p, ...prev]);
    setEdit(null);
  };
  return (
    <>
      <div className="sec-h"><div><p className="label">Маркетинг</p><h2>Промокоды</h2></div>
        <button type="button" className="btn btn-blue btn-m" onClick={() => setEdit("new")}>Добавить промокод</button></div>
      <table className="atable">
        <thead><tr><th>Код</th><th>Скидка</th><th>Мин. сумма</th><th>Использований</th><th>Статус</th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.code} onClick={() => setEdit(p)}>
              <td><b>{p.code}</b></td>
              <td>{p.type === "%" ? `${p.value}%` : formatPrice(p.value)}</td>
              <td>{p.min ? formatPrice(p.min) : "—"}</td>
              <td>{p.used}{p.limit ? ` / ${p.limit}` : ""}</td>
              <td><span className={`badge ${p.active ? "badge-ok" : "badge-mute"}`}>{p.active ? "Активен" : "Выключен"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <EditPromo promo={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSave={save} />}
    </>
  );
}
function EditPromo({ promo, onClose, onSave }: { promo: Promo | null; onClose: () => void; onSave: (p: Promo) => void }) {
  const [code, setCode] = useState(promo?.code ?? "");
  const [type, setType] = useState<"%" | "₽">(promo?.type ?? "%");
  const [value, setValue] = useState(promo?.value ?? 10);
  const [min, setMin] = useState(promo?.min ?? 0);
  const [limit, setLimit] = useState(promo?.limit ?? 0);
  const [active, setActive] = useState(promo?.active ?? true);
  return (
    <Modal title={promo ? "Промокод" : "Новый промокод"} onClose={onClose}>
      <label className="fld"><span className="fld-l">Код</span><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="НАПРИМЕР2025" /></label>
      <div className="fgrid">
        <label className="fld"><span className="fld-l">Тип</span>
          <select value={type} onChange={(e) => setType(e.target.value as "%" | "₽")}><option value="%">Процент</option><option value="₽">Фикс. сумма</option></select></label>
        <label className="fld"><span className="fld-l">Значение</span><input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} /></label>
        <label className="fld"><span className="fld-l">Мин. сумма, ₽</span><input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} /></label>
        <label className="fld"><span className="fld-l">Лимит (0 — без)</span><input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></label>
      </div>
      <label className="dopt" style={{ marginBottom: 16 }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span><span className="dopt-t">Активен</span></span></label>
      <button type="button" className="btn btn-blue btn-l" disabled={!code} onClick={() => onSave({ code, type, value, min, limit, used: promo?.used ?? 0, active })}>Сохранить</button>
    </Modal>
  );
}

// ─── Разделы (дерево) ────────────────────────────────────────────
function Categories() {
  const roots = categories.filter((c) => !c.parent);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <>
      <div className="sec-h"><div><p className="label">Каталог</p><h2>Разделы</h2></div>
        <button type="button" className="btn btn-blue btn-m">Добавить раздел</button></div>
      <p className="hint" style={{ marginBottom: 16 }}>Дерево разделов. В боевой версии — перетаскивание, SEO-поля и картинки; здесь — структура и правка названия.</p>
      <div className="abox">
        {roots.map((r) => (
          <div key={r.slug} style={{ marginBottom: 8 }}>
            <CatRow name={r.name} slug={r.slug} onEdit={() => setEditing(r.slug)} />
            {childrenOf(r.slug).length > 0 && (
              <div style={{ paddingLeft: 20, borderLeft: "1px solid var(--rso-border-faint)", marginLeft: 8, marginTop: 4 }}>
                {childrenOf(r.slug).map((k) => <CatRow key={k.slug} name={k.name} slug={k.slug} onEdit={() => setEditing(k.slug)} />)}
              </div>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <Modal title="Раздел" onClose={() => setEditing(null)}>
          <label className="fld"><span className="fld-l">Название</span><input defaultValue={categories.find((c) => c.slug === editing)?.name} /></label>
          <label className="fld"><span className="fld-l">SEO-текст (над сеткой)</span><textarea rows={3} defaultValue={categories.find((c) => c.slug === editing)?.seoText ?? ""} /></label>
          <button type="button" className="btn btn-blue btn-l" onClick={() => setEditing(null)}>Сохранить</button>
        </Modal>
      )}
    </>
  );
}
function CatRow({ name, slug, onEdit }: { name: string; slug: string; onEdit: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0" }}>
      <span style={{ fontFamily: "var(--font-core)" }}>{name} <span className="hist-w">/{slug}</span></span>
      <button type="button" className="btn btn-ghost btn-s" onClick={onEdit}>Править</button>
    </div>
  );
}

// ─── Статические страницы ────────────────────────────────────────
function Pages() {
  const [list] = useState(Object.entries(staticPages).map(([slug, p]) => ({ slug, title: p.title })));
  const [edit, setEdit] = useState<string | null>(null);
  return (
    <>
      <div className="sec-h"><div><p className="label">Контент</p><h2>Страницы</h2></div></div>
      <table className="atable">
        <thead><tr><th>Страница</th><th>Адрес</th><th></th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.slug} onClick={() => setEdit(p.slug)}>
              <td><b>{p.title}</b></td><td>/{p.slug}</td>
              <td style={{ textAlign: "right" }}><span className="link">Редактировать</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && (
        <Modal title={staticPages[edit]?.title ?? "Страница"} onClose={() => setEdit(null)}>
          <label className="fld"><span className="fld-l">Заголовок</span><input defaultValue={staticPages[edit]?.title} /></label>
          <label className="fld"><span className="fld-l">Описание (SEO)</span><input defaultValue={staticPages[edit]?.description} /></label>
          <label className="fld"><span className="fld-l">Содержимое</span><textarea rows={6} defaultValue={staticPages[edit]?.lead ?? staticPages[edit]?.prose?.map((b) => b.p).join("\n\n") ?? ""} /></label>
          <button type="button" className="btn btn-blue btn-l" onClick={() => setEdit(null)}>Сохранить</button>
        </Modal>
      )}
    </>
  );
}

// ─── Пользователи ────────────────────────────────────────────────
type AUser = { name: string; email: string; role: "Администратор" | "Менеджер" | "Контент-менеджер"; active: boolean };
function Users() {
  const [list, setList] = useState<AUser[]>([
    { name: "Администратор", email: "admin@trudkrutshop.ru", role: "Администратор", active: true },
    { name: "Мария Соколова", email: "manager@trudkrutshop.ru", role: "Менеджер", active: true },
    { name: "Пётр Контентов", email: "content@trudkrutshop.ru", role: "Контент-менеджер", active: false },
  ]);
  const [edit, setEdit] = useState<AUser | "new" | null>(null);
  const save = (u: AUser) => {
    setList((prev) => prev.some((x) => x.email === u.email) ? prev.map((x) => x.email === u.email ? u : x) : [u, ...prev]);
    setEdit(null);
  };
  return (
    <>
      <div className="sec-h"><div><p className="label">Доступ</p><h2>Пользователи</h2></div>
        <button type="button" className="btn btn-blue btn-m" onClick={() => setEdit("new")}>Добавить сотрудника</button></div>
      <table className="atable">
        <thead><tr><th>Имя</th><th>E-mail</th><th>Роль</th><th>Статус</th></tr></thead>
        <tbody>
          {list.map((u) => (
            <tr key={u.email} onClick={() => setEdit(u)}>
              <td><b>{u.name}</b></td><td>{u.email}</td><td>{u.role}</td>
              <td><span className={`badge ${u.active ? "badge-ok" : "badge-mute"}`}>{u.active ? "Активен" : "Отключён"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <EditUser user={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSave={save} />}
    </>
  );
}
function EditUser({ user, onClose, onSave }: { user: AUser | null; onClose: () => void; onSave: (u: AUser) => void }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<AUser["role"]>(user?.role ?? "Менеджер");
  const [active, setActive] = useState(user?.active ?? true);
  return (
    <Modal title={user ? "Сотрудник" : "Новый сотрудник"} onClose={onClose}>
      <div className="fgrid">
        <label className="fld"><span className="fld-l">Имя</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="fld"><span className="fld-l">E-mail</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      </div>
      <label className="fld"><span className="fld-l">Роль</span>
        <select value={role} onChange={(e) => setRole(e.target.value as AUser["role"])}>
          <option>Администратор</option><option>Менеджер</option><option>Контент-менеджер</option>
        </select></label>
      <label className="dopt" style={{ marginBottom: 16 }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span><span className="dopt-t">Доступ включён</span></span></label>
      <button type="button" className="btn btn-blue btn-l" disabled={!name || !email} onClick={() => onSave({ name, email, role, active })}>Сохранить</button>
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
