import { describe, expect, it } from "vitest";
import { available, recordMovement, release, reserve, shipReservation } from "./stock";

// Мини-имитация Prisma-транзакции в памяти: хранит варианты и движения,
// понимает { increment: n } и присваивание числом (как реальный клиент).
type Variant = { id: string; stock: number; reserved: number };

function fakeTx(variants: Variant[]) {
  const store = new Map(variants.map((v) => [v.id, { ...v }]));
  const movements: { variantId: string; delta: number; reason: string }[] = [];

  const apply = (cur: number, val: unknown): number =>
    val && typeof val === "object" && "increment" in val
      ? cur + (val as { increment: number }).increment
      : (val as number);

  const tx = {
    productVariant: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async findUniqueOrThrow({ where }: any) {
        const v = store.get(where.id);
        if (!v) throw new Error("not found");
        return { ...v };
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async update({ where, data }: any) {
        const v = store.get(where.id)!;
        if (data.stock !== undefined) v.stock = apply(v.stock, data.stock);
        if (data.reserved !== undefined) v.reserved = apply(v.reserved, data.reserved);
        return { ...v };
      },
    },
    stockMovement: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async create({ data }: any) {
        movements.push({ variantId: data.variantId, delta: data.delta, reason: data.reason });
        return { id: `m${movements.length}`, ...data };
      },
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { tx: tx as any, store, movements };
}

describe("available", () => {
  it("остаток минус бронь, не ниже нуля", () => {
    expect(available({ stock: 10, reserved: 3 })).toBe(7);
    expect(available({ stock: 2, reserved: 5 })).toBe(0);
  });
});

describe("recordMovement", () => {
  it("создаёт движение и синхронно меняет остаток", async () => {
    const { tx, store, movements } = fakeTx([{ id: "v1", stock: 10, reserved: 0 }]);
    await recordMovement(tx, { variantId: "v1", delta: -3, reason: "OFFLINE_SALE" });
    expect(store.get("v1")!.stock).toBe(7);
    expect(movements).toHaveLength(1);
    expect(movements[0].delta).toBe(-3);
  });

  it("запрещает нулевую дельту", async () => {
    const { tx } = fakeTx([{ id: "v1", stock: 10, reserved: 0 }]);
    await expect(recordMovement(tx, { variantId: "v1", delta: 0, reason: "MANUAL" })).rejects.toThrow();
  });
});

describe("reserve / release", () => {
  it("бронь уменьшает доступное, но не остаток", async () => {
    const { tx, store } = fakeTx([{ id: "v1", stock: 5, reserved: 0 }]);
    await reserve(tx, "v1", 2);
    expect(store.get("v1")!.reserved).toBe(2);
    expect(store.get("v1")!.stock).toBe(5);
    expect(available(store.get("v1")!)).toBe(3);
  });

  it("бросает, если недостаточно доступного остатка", async () => {
    const { tx } = fakeTx([{ id: "v1", stock: 5, reserved: 4 }]);
    await expect(reserve(tx, "v1", 2)).rejects.toThrow(/Недостаточно/);
  });

  it("release снимает бронь и не уходит в минус", async () => {
    const { tx, store } = fakeTx([{ id: "v1", stock: 5, reserved: 2 }]);
    await release(tx, "v1", 5);
    expect(store.get("v1")!.reserved).toBe(0);
  });
});

describe("shipReservation", () => {
  it("списывает со склада движением и снимает бронь", async () => {
    const { tx, store, movements } = fakeTx([{ id: "v1", stock: 10, reserved: 3 }]);
    await shipReservation(tx, { variantId: "v1", qty: 3, orderId: "o1" });
    expect(store.get("v1")!.stock).toBe(7);
    expect(store.get("v1")!.reserved).toBe(0);
    expect(movements[0]).toMatchObject({ delta: -3, reason: "ONLINE_SALE" });
  });
});
