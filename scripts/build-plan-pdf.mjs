// Собирает docs/plan.md в PDF. Запуск: npm run plan:pdf
import { marked } from 'marked';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const src = process.argv[2] ?? path.join(root, 'docs', 'plan.md');
const out = process.argv[3] ?? path.join(root, 'docs', 'План разработки ТрудКрутШоп.pdf');

let md = fs.readFileSync(src, 'utf8');

// Первый заголовок уходит на титульный лист — убираем его из потока
md = md.replace(/^#\s+.*\n/, '');

const body = marked.parse(md, { gfm: true, breaks: false });

const today = new Date().toLocaleDateString('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric',
});

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>План разработки интернет-магазина «ТрудКрутШоп»</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm 20mm 16mm;
    @bottom-center { content: counter(page); }
  }
  :root {
    --ink: #16181d;
    --muted: #5b6472;
    --line: #d8dde5;
    --accent: #1f4fd8;
    --tint: #f4f6fa;
  }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: "Georgia", "Times New Roman", serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: var(--ink);
    margin: 0;
  }

  /* ---------- Титульный лист ---------- */
  .cover {
    height: 247mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    page-break-after: always;
    text-align: left;
  }
  .cover .kicker {
    font-family: system-ui, "Segoe UI", sans-serif;
    font-size: 9pt;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 14mm;
  }
  .cover h1 {
    font-size: 30pt;
    line-height: 1.15;
    margin: 0 0 6mm;
    font-weight: 700;
    border: none;
    padding: 0;
  }
  .cover .rule {
    width: 42mm;
    height: 3px;
    background: var(--accent);
    margin: 0 0 8mm;
  }
  .cover .lede {
    font-size: 12pt;
    color: var(--muted);
    max-width: 120mm;
    margin: 0 0 22mm;
  }
  .cover dl {
    font-family: system-ui, "Segoe UI", sans-serif;
    font-size: 9.5pt;
    margin: 0;
    display: grid;
    grid-template-columns: 34mm 1fr;
    row-gap: 2.5mm;
    max-width: 120mm;
  }
  .cover dt { color: var(--muted); }
  .cover dd { margin: 0; }

  /* ---------- Заголовки ---------- */
  h2, h3, h4 {
    font-family: system-ui, "Segoe UI", sans-serif;
    color: var(--ink);
    page-break-after: avoid;
    break-after: avoid;
  }
  h2 {
    font-size: 16pt;
    margin: 12mm 0 4mm;
    padding-bottom: 2mm;
    border-bottom: 2px solid var(--accent);
    page-break-before: always;
  }
  h2:first-of-type { page-break-before: avoid; margin-top: 0; }
  h3 { font-size: 12.5pt; margin: 7mm 0 2.5mm; }
  h4 { font-size: 11pt; margin: 5mm 0 2mm; color: var(--muted); }

  p { margin: 0 0 3mm; orphans: 3; widows: 3; }

  /* ---------- Таблицы ---------- */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 3mm 0 6mm;
    font-family: system-ui, "Segoe UI", sans-serif;
    font-size: 8.8pt;
    line-height: 1.4;
    page-break-inside: auto;
  }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  th {
    background: var(--tint);
    text-align: left;
    font-weight: 600;
    padding: 2mm 2.5mm;
    border-bottom: 1.5px solid var(--line);
    vertical-align: bottom;
  }
  td {
    padding: 2mm 2.5mm;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }
  tbody tr:nth-child(even) td { background: #fbfcfe; }

  /* ---------- Списки ---------- */
  ul, ol { margin: 0 0 4mm; padding-left: 6mm; }
  li { margin-bottom: 1.5mm; }
  li > ul, li > ol { margin-top: 1.5mm; }

  /* ---------- Код ---------- */
  code {
    font-family: "Consolas", "Cascadia Mono", monospace;
    font-size: 8.8pt;
    background: var(--tint);
    padding: 0.4mm 1.2mm;
    border-radius: 2px;
  }
  pre {
    background: var(--tint);
    border-left: 3px solid var(--accent);
    padding: 3mm 4mm;
    font-size: 8pt;
    line-height: 1.45;
    overflow: visible;
    white-space: pre-wrap;
    page-break-inside: avoid;
    margin: 3mm 0 5mm;
  }
  pre code { background: none; padding: 0; font-size: inherit; }

  /* ---------- Прочее ---------- */
  hr {
    border: none;
    border-top: 1px solid var(--line);
    margin: 7mm 0;
  }
  strong { font-weight: 700; }
  a { color: var(--accent); text-decoration: none; }
  blockquote {
    margin: 3mm 0;
    padding-left: 4mm;
    border-left: 3px solid var(--line);
    color: var(--muted);
  }
</style>
</head>
<body>
<section class="cover">
  <div class="kicker">Техническое предложение</div>
  <h1>План разработки интернет-магазина «ТрудКрутШоп»</h1>
  <div class="rule"></div>
  <p class="lede">Архитектура, календарный план, риски и перечень материалов, необходимых от заказчика.</p>
  <dl>
    <dt>Основание</dt><dd>Техническое задание для интернет-магазина ТрудКрутШоп</dd>
    <dt>Технологии</dt><dd>Next.js, PostgreSQL, размещение на VPS в РФ</dd>
    <dt>Оценка срока</dt><dd>12 недель от старта работ</dd>
    <dt>Дата документа</dt><dd>${today}</dd>
  </dl>
</section>
${body}
</body>
</html>`;

const tmpHtml = path.join(os.tmpdir(), `tksh-plan-${Date.now()}.html`);
fs.writeFileSync(tmpHtml, html, 'utf8');

const candidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  throw new Error('Не найден Chrome или Edge — они нужны для печати в PDF.');
}

execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${out}`,
  `file:///${tmpHtml.replaceAll('\\', '/')}`,
], { stdio: 'ignore' });

fs.rmSync(tmpHtml, { force: true });
console.log('PDF готов:', out);
