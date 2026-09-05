const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

/** «250 ₽» — цена без копеек, узкий неразрывный пробел, знак после суммы. */
export function formatPrice(value: number): string {
  return rub.format(value);
}

/** Детерминированное перемешивание с зерном — псевдослучайный порядок каталога.
 * Референс-план требует «случайный порядок» на главной, но настоящий random
 * на каждый запрос ломает кеш. Зерно меняем раз в несколько часов → визуально
 * то же, для сервера дёшево. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const arr = [...items];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Зерно, стабильное в пределах текущего 3-часового окна. */
export function currentSeed(): number {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 3));
}
