import assert from "node:assert/strict";
import test from "node:test";
import { findPromo, quote } from "../src/lib/price.ts";

test("child price is seventy percent and a percent code applies to the whole party", () => {
  const priced = quote({
    adultPrice: 100_000,
    adults: 2,
    children: 1,
    addons: [{ price: 10_000, quantity: 1 }],
    promo: findPromo("AURA10"),
  });
  assert.equal(priced.childPrice, 70_000);
  assert.equal(priced.party, 270_000);
  assert.equal(priced.extras, 10_000);
  assert.equal(priced.discount, 28_000);
  assert.equal(priced.total, 252_000);
});

test("an unknown code does not invent a discount", () => {
  assert.equal(findPromo("NOPE"), null);
});

test("a fixed code cannot reduce the total below zero", () => {
  const priced = quote({
    adultPrice: 20_000,
    adults: 1,
    children: 0,
    addons: [],
    promo: findPromo("WELCOME500"),
  });
  assert.equal(priced.total, 0);
});
