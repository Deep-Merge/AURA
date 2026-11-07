export type Promo = { code: string; type: "percent" | "amount"; value: number };

export const PROMOS: Promo[] = [
  { code: "AURA10", type: "percent", value: 10 },
  { code: "WELCOME500", type: "amount", value: 50_000 },
];

export function findPromo(code: string | undefined | null): Promo | null {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  return PROMOS.find((promo) => promo.code === clean) ?? null;
}

export function quote(input: {
  adultPrice: number;
  adults: number;
  children: number;
  addons: { price: number; quantity: number }[];
  promo: Promo | null;
}) {
  const childPrice = Math.round(input.adultPrice * 0.7);
  const party = input.adults * input.adultPrice + input.children * childPrice;
  const extras = input.addons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0);
  const base = party + extras;
  let discount = 0;
  if (input.promo?.type === "percent") discount = Math.round(base * (input.promo.value / 100));
  if (input.promo?.type === "amount") discount = input.promo.value;
  discount = Math.max(0, Math.min(discount, base));
  return {
    childPrice,
    party,
    extras,
    discount,
    total: base - discount,
  };
}

export function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
