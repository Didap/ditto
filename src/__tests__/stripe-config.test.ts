import { describe, it, expect } from "vitest";

const LAUNCH_DISCOUNT = 0.30;

const PLANS = {
  free: { name: "Free", credits: 300, priceUsd: 0 },
  pro: { name: "Pro", credits: 1500, priceUsd: 1500 }, // $15
  team: { name: "Team", credits: 5000, priceUsd: 2500 }, // $25
};

const REGIONAL_PRICES = {
  pro: {
    it: { amount: 999, currency: "eur" },
    eu: { amount: 1299, currency: "eur" },
    us: { amount: 1500, currency: "usd" },
  },
  team: {
    it: { amount: 1999, currency: "eur" },
    eu: { amount: 2399, currency: "eur" },
    us: { amount: 2500, currency: "usd" },
  },
};

const CREDIT_PACKS = [
  { id: "pack-500", credits: 500, priceUsd: 500 },
  { id: "pack-2000", credits: 2000, priceUsd: 1900 },
  { id: "pack-5000", credits: 5000, priceUsd: 4500 },
];

describe("Stripe pricing config", () => {
  it("has 3 plans (free, pro, team)", () => {
    expect(Object.keys(PLANS)).toEqual(["free", "pro", "team"]);
  });

  it("free plan costs $0", () => {
    expect(PLANS.free.priceUsd).toBe(0);
    expect(PLANS.free.credits).toBe(300);
  });

  it("pro plan gives 1500 credits at $15/mo (US)", () => {
    expect(PLANS.pro.credits).toBe(1500);
    expect(PLANS.pro.priceUsd).toBe(1500);
  });

  it("team plan gives 5000 credits at $25/mo (US)", () => {
    expect(PLANS.team.credits).toBe(5000);
    expect(PLANS.team.priceUsd).toBe(2500);
  });

  it("launch coupon is 30% off", () => {
    expect(LAUNCH_DISCOUNT).toBe(0.30);
  });

  it("regional prices — Italy is cheapest, US is most expensive", () => {
    expect(REGIONAL_PRICES.pro.it.amount).toBeLessThan(REGIONAL_PRICES.pro.eu.amount);
    expect(REGIONAL_PRICES.pro.eu.amount).toBeLessThan(REGIONAL_PRICES.pro.us.amount);
    expect(REGIONAL_PRICES.team.it.amount).toBeLessThan(REGIONAL_PRICES.team.eu.amount);
    expect(REGIONAL_PRICES.team.eu.amount).toBeLessThan(REGIONAL_PRICES.team.us.amount);
  });

  it("regional prices — EUR for IT/EU, USD for US", () => {
    expect(REGIONAL_PRICES.pro.it.currency).toBe("eur");
    expect(REGIONAL_PRICES.pro.eu.currency).toBe("eur");
    expect(REGIONAL_PRICES.pro.us.currency).toBe("usd");
  });

  it("has 3 credit packs", () => {
    expect(CREDIT_PACKS.length).toBe(3);
  });

  it("credit packs have increasing credits", () => {
    const credits = CREDIT_PACKS.map((p) => p.credits);
    expect(credits).toEqual([500, 2000, 5000]);
  });

  it("100 credits = $1 base rate holds for smallest pack", () => {
    expect(CREDIT_PACKS[0].priceUsd / CREDIT_PACKS[0].credits).toBe(1);
  });

  it("larger packs have volume discount", () => {
    const perCredit = CREDIT_PACKS.map((p) => p.priceUsd / p.credits);
    expect(perCredit[1]).toBeLessThan(perCredit[0]);
    expect(perCredit[2]).toBeLessThan(perCredit[1]);
  });
});
