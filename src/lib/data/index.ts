// Слой доступа к данным витрины (фасад).
//
// Сейчас делегирует в тестовые данные (lib/test-data). Все функции async и по
// сигнатурам совпадают с будущей Prisma-реализацией (lib/data/prisma-repo.ts).
// Когда БД поднимется (npm install → migrate → seed), переключение — заменой
// импорта ниже на `./prisma-repo`. Страницы витрины трогать не нужно.
//
//   // было:
//   import * as source from "@/lib/test-data-source";
//   // станет:
//   import * as source from "./prisma-repo";

// Источник данных: Prisma (БД) по умолчанию; при DATA_SOURCE=mock —
// статические тестовые данные (для локального просмотра фронтенда без БД).
import * as prismaSource from "./prisma-repo";
import * as mockSource from "./mock-repo";

const source = process.env.DATA_SOURCE === "mock" ? mockSource : prismaSource;

export type { Product, Category, Variant } from "@/lib/test-data";

export const getTopCategories = source.getTopCategories;
export const getCategory = source.getCategory;
export const getBreadcrumb = source.getBreadcrumb;
export const isLeafCategory = source.isLeafCategory;
export const getChildren = source.getChildren;
export const getCategoryTree = source.getCategoryTree;
export const getCategoryProducts = source.getCategoryProducts;
export const getProduct = source.getProduct;
export const getSimilar = source.getSimilar;
export const getBoughtWith = source.getBoughtWith;
export const getAllProducts = source.getAllProducts;
export const searchProducts = source.searchProducts;
export const getBestsellers = source.getBestsellers;
export const getNew = source.getNew;

// Чистый помощник (не зависит от источника данных).
export { inStock } from "@/lib/test-data";
