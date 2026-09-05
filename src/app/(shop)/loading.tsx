// Скелетон загрузки витрины (пункт ТЗ: явные состояния загрузки).
export default function Loading() {
  return (
    <div className="wrap" style={{ padding: "24px 0 60px" }} aria-busy="true" aria-label="Загрузка">
      <div className="sk sk-title" />
      <div className="pgrid" style={{ marginTop: 24 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="pcard" key={i}>
            <div className="pcard-img"><div className="ph sk" style={{ aspectRatio: "1", borderRadius: 20 }} /></div>
            <div className="pcard-b">
              <div className="sk sk-line" />
              <div className="sk sk-line" style={{ width: "50%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
