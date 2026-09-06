import { describe, expect, it } from "vitest";
import { rublesInWords } from "./rubles-in-words";

describe("rublesInWords", () => {
  it("рубли и копейки", () => {
    expect(rublesInWords(1234.5)).toBe("Одна тысяча двести тридцать четыре рубля 50 копеек");
  });

  it("ноль", () => {
    expect(rublesInWords(0)).toBe("Ноль рублей 00 копеек");
  });

  it("склонение тысяч (женский род)", () => {
    expect(rublesInWords(21000)).toBe("Двадцать одна тысяча рублей 00 копеек");
    expect(rublesInWords(2000)).toBe("Две тысячи рублей 00 копеек");
    expect(rublesInWords(5000)).toBe("Пять тысяч рублей 00 копеек");
  });

  it("миллионы", () => {
    expect(rublesInWords(1_000_000)).toBe("Один миллион рублей 00 копеек");
  });

  it("склонение рублей", () => {
    expect(rublesInWords(1)).toBe("Один рубль 00 копеек");
    expect(rublesInWords(2)).toBe("Два рубля 00 копеек");
    expect(rublesInWords(5)).toBe("Пять рублей 00 копеек");
    expect(rublesInWords(11)).toBe("Одиннадцать рублей 00 копеек");
  });

  it("округляет копейки", () => {
    expect(rublesInWords(99.999)).toBe("Сто рублей 00 копеек");
    expect(rublesInWords(0.01)).toBe("Ноль рублей 01 копейка");
  });
});
