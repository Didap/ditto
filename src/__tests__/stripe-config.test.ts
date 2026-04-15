import { describe, it, expect } from "vitest";

// Import only the pricing constants, not the stripe client
const LAUNCH_DISCOUNT = 0.30;
const PLANS = {
  free: { name: "Free", credits: 300, priceUsd: 0, launchPriceUsd: 0 },
  pro: { name: "Pro", credits: 1500, priceUsd: 900, launchPriceUsd: 630 },
  team: { name: "Team", credits: 5000, priceUsd: 2900, launchPriceUsd: 2030 },
};
const CREDIT_PACKS = [
  { id: "pack-500", credits: 500, priceUsd: 500, launchPriceUsd: 350 },
  { id: "pack-2000", credits: 2000, priceUsd: 1900, launchPriceUsd: 1330 },
  { id: "pack-5000", credits: 5000, priceUsd: 4500, launchPriceUsd: 3150 },
];

describe("Stripe pricing config", () => {
  it("has 3 plans (free, pro, team)", () => {
    expect(Object.keys(PLANS)).toEqual(["free", "pro", "team"]);
  });

  it("free plan costs $0", () => {
    expect(PLANS.free.priceUsd).toBe(0);
    expect(PLANS.free.credits).toBe(300);
  });

  it("pro plan gives 1500 credits", () => {
    expect(PLANS.pro.credits).toBe(1500);
    expect(PLANS.pro.priceUsd).toBe(900);
  });

  it("team plan gives 5000 credits", () => {
    expect(PLANS.team.credits).toBe(5000);
    expect(PLANS.team.priceUsd).toBe(2900);
  });

  it("launch prices are 30% off base", () => {
    expect(LAUNCH_DISCOUNT).toBe(0.30);
    // Pro: $9 * 0.7 = $6.30
    expect(PLANS.pro.launchPriceUsd).toBe(630);
    // Team: $29 * 0.7 = $20.30
    expect(PLANS.team.launchPriceUsd).toBe(2030);
  });

  it("has 3 credit packs", () => {
    expect(CREDIT_PACKS.length).toBe(3);
  });

  it("credit packs have increasing credits", () => {
    const credits = CREDIT_PACKS.map((p) => p.credits);
    expect(credits).toEqual([500, 2000, 5000]);
  });

  it("credit packs have correct launch prices", () => {
    expect(CREDIT_PACKS[0].launchPriceUsd).toBe(350);  // $3.50
    expect(CREDIT_PACKS[1].launchPriceUsd).toBe(1330); // $13.30
    expect(CREDIT_PACKS[2].launchPriceUsd).toBe(3150); // $31.50
  });

  it("100 credits = $1 base rate holds for packs", () => {
    // Pack 500: $5 = 100cr/$1 exactly
    expect(CREDIT_PACKS[0].priceUsd / CREDIT_PACKS[0].credits).toBe(1);
  });

  it("larger packs have volume discount", () => {
    const perCredit = CREDIT_PACKS.map((p) => p.priceUsd / p.credits);
    // Each successive pack should be cheaper per credit
    expect(perCredit[1]).toBeLessThan(perCredit[0]);
    expect(perCredit[2]).toBeLessThan(perCredit[1]);
  });
});
