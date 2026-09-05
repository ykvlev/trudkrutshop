import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: "80px 0", textAlign: "center" }}>
      <p className="label">Ошибка 404</p>
      <h1 style={{ marginTop: 8 }}>Страница не найдена</h1>
      <p className="seo" style={{ margin: "0 auto 24px" }}>
        Возможно, товар снят с продажи или ссылка устарела. Загляните в каталог.
      </p>
      <div className="row-btns" style={{ justifyContent: "center" }}>
        <Link href="/" className="btn btn-blue btn-l">На главную</Link>
        <Link href="/catalog/futbolki" className="btn btn-outline btn-l">В каталог</Link>
      </div>
    </div>
  );
}
