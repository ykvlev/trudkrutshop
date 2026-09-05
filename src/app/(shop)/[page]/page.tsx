import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconTelegram, IconVk } from "@/components/shop/icons";
import { pages, staticSlugs } from "@/lib/pages";

export function generateStaticParams() {
  return staticSlugs.map((page) => ({ page }));
}

export async function generateMetadata(props: PageProps<"/[page]">): Promise<Metadata> {
  const { page } = await props.params;
  const p = pages[page];
  if (!p) return { title: "Страница не найдена" };
  return { title: p.title, description: p.description };
}

export default async function StaticPageRoute(props: PageProps<"/[page]">) {
  const { page } = await props.params;
  const p = pages[page];
  if (!p) notFound();

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <nav aria-label="Хлебные крошки" className="crumbs">
        <Link href="/">Главная</Link>
        <span className="crumbs-s">/</span>
        <span>{p.title}</span>
      </nav>

      <div className="page-narrow">
        <p className="label">ТрудКрутШоп</p>
        <h1>{p.title}</h1>
        {p.lead && <p className="lead">{p.lead}</p>}

        {p.draft && (
          <div className="pdp-note" style={{ margin: "16px 0" }}>
            Черновик. Финальный юридический текст предоставляет заказчик — вставим без изменений вёрстки.
          </div>
        )}

        {p.qa && (
          <div className="qa">
            {p.qa.map((item) => (
              <div className="qa-i" key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        )}

        {p.prose && (
          <div className="prose">
            {p.prose.map((b, i) => (
              <div key={i}>
                {b.h && <h2>{b.h}</h2>}
                <p>{b.p}</p>
              </div>
            ))}
          </div>
        )}

        {p.contacts && <Contacts />}

        {p.cta && (
          <div className="cta">
            <h2 style={{ margin: 0 }}>{p.cta.title}</h2>
            <Link href={p.cta.href} className="btn btn-white btn-l">{p.cta.btn} →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Contacts() {
  return (
    <>
      <div className="qa">
        <div className="qa-i">
          <h3>Магазин</h3>
          <p>Москва, Лефортовский переулок, 8 стр. 1</p>
          <p>Пн–Пт 10:00–20:00, выходные по согласованию</p>
        </div>
        <div className="qa-i">
          <h3>Связь</h3>
          <p><a href="mailto:rso.simv@mail.ru">rso.simv@mail.ru</a></p>
          <div className="ftr-soc" style={{ marginTop: 8 }}>
            <a href="https://vk.com" aria-label="ВКонтакте"><IconVk /></a>
            <a href="https://t.me" aria-label="Telegram"><IconTelegram /></a>
          </div>
        </div>
      </div>
      <div className="qa-i">
        <h3>Реквизиты</h3>
        <p>АНО ДПО «РСО-РАЗВИТИЕ» · ИНН 7743351523 · КПП 770101001 · ОГРН 1207700490249</p>
        <p>Юридический адрес: 105066, г. Москва, ул. Доброслободская, д. 6 стр. 1, пом. I ком. 3</p>
      </div>
    </>
  );
}
