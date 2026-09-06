// Сумма прописью на русском для счёта: 1234.50 → «Одна тысяча двести
// тридцать четыре рубля 50 копеек».

const ONES = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const ONES_F = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

// Склонение по числу: [1, 2-4, 5-0].
function plural(n: number, forms: [string, string, string]): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}

function triadToWords(n: number, feminine: boolean): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  if (h) parts.push(HUNDREDS[h]);
  if (t === 1) {
    parts.push(TEENS[o]);
  } else {
    if (t) parts.push(TENS[t]);
    if (o) parts.push((feminine ? ONES_F : ONES)[o]);
  }
  return parts.join(" ");
}

export function rublesInWords(amount: number): string {
  // Считаем в копейках, чтобы округление корректно переносилось в рубли
  // (99.999 → 100 руб. 00 коп., а не 99 руб. 100 коп.).
  const totalKop = Math.round(Math.abs(amount) * 100);
  const rub = Math.floor(totalKop / 100);
  const kop = totalKop % 100;

  if (rub === 0) {
    const kw = plural(kop, ["копейка", "копейки", "копеек"]);
    return `Ноль рублей ${String(kop).padStart(2, "0")} ${kw}`;
  }

  const triads: string[] = [];
  const millions = Math.floor(rub / 1_000_000);
  const thousands = Math.floor((rub % 1_000_000) / 1000);
  const units = rub % 1000;

  if (millions) {
    triads.push(triadToWords(millions, false));
    triads.push(plural(millions, ["миллион", "миллиона", "миллионов"]));
  }
  if (thousands) {
    triads.push(triadToWords(thousands, true));
    triads.push(plural(thousands, ["тысяча", "тысячи", "тысяч"]));
  }
  if (units) triads.push(triadToWords(units, false));

  const words = triads.join(" ").replace(/\s+/g, " ").trim();
  const rubWord = plural(rub, ["рубль", "рубля", "рублей"]);
  const kopWord = plural(kop, ["копейка", "копейки", "копеек"]);
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} ${rubWord} ${String(kop).padStart(2, "0")} ${kopWord}`;
}
