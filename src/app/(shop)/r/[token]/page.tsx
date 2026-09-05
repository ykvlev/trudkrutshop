import type { Metadata } from "next";

// Закрытая страница для региональных отделений: доступ по длинной непредсказуемой
// ссылке /r/<token>, вне карты сайта, noindex. Содержимое правится в админке
// (модель RegionalPage). Опционально защищается паролем. Здесь — демо-каркас:
// принимаем любой токен и показываем пример наполнения.

export const metadata: Metadata = {
  title: "Оптовый прайс для отделений",
  robots: { index: false, follow: false },
};

const price = [
  { name: "Футболка «РСО»", retail: 1290, wholesale: 890 },
  { name: "Худи «РСО» с начёсом", retail: 3450, wholesale: 2490 },
  { name: "Пин «ТрудКрут»", retail: 250, wholesale: 150 },
  { name: "Кирпич (значок)", retail: 220, wholesale: 130 },
];

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

export default async function RegionalPage(props: PageProps<"/r/[token]">) {
  await props.params; // токен проверяется в реальной версии по RegionalPage.token

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <div className="page-narrow">
        <span className="closed">🔒 Закрытая страница · только по ссылке</span>
        <p className="label">Для отделений</p>
        <h1>Оптовый прайс и условия</h1>
        <p className="lead">Специальные цены для региональных отделений РСО при заказе от 20 000 ₽. Страница доступна только по прямой ссылке.</p>

        <h2 style={{ margin: "28px 0 12px" }}>Прайс</h2>
        <table className="chart">
          <thead>
            <tr><th>Позиция</th><th>Розница</th><th>Опт</th></tr>
          </thead>
          <tbody>
            {price.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="num">{fmt(r.retail)}</td>
                <td className="num" style={{ color: "var(--rso-blue-deep)" }}>{fmt(r.wholesale)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={{ margin: "28px 0 12px" }}>Оставить заявку</h2>
        <div className="fgrid">
          <label className="fld"><span className="fld-l">Отделение / город</span><input placeholder="Например, Московский РСО" /></label>
          <label className="fld"><span className="fld-l">Контактное лицо</span><input placeholder="ФИО" /></label>
          <label className="fld"><span className="fld-l">Телефон</span><input placeholder="+7 900 000-00-00" /></label>
          <label className="fld"><span className="fld-l">E-mail</span><input placeholder="you@mail.ru" /></label>
        </div>
        <label className="fld"><span className="fld-l">Что нужно</span><textarea rows={3} placeholder="Состав и количество" /></label>
        <button type="button" className="btn btn-blue btn-l">Отправить заявку</button>
      </div>
    </div>
  );
}
