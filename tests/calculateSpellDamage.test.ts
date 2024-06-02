import { calculateSpellDamage } from "@/Code";

describe("calculateSpellDamage", () => {
  it("calculate fireball correctly", () => {
    const result = calculateSpellDamage(15, "8d6", "", "", false, 7, 1);
    const correct = 0.6 * ((8 * 3.5) / 2) + 0.4 * (8 * 3.5);
    expect(result).toBeCloseTo(correct);
  });

  it("calculate fireball with evasion correctly (success = no damage)", () => {
    const result = calculateSpellDamage(15, "8d6", "", "", true, 7, 1);
    const correct = 0.0 * ((8 * 3.5) / 2) + 0.4 * (8 * 3.5);
    expect(result).toBeCloseTo(correct);
  });

  it("calculate fireball with arcane firearm correctly", () => {
    const result = calculateSpellDamage(15, "8d6", "", "1d8", false, 7, 1);
    const correct = 0.6 * ((8 * 3.5 + 4.5) / 2) + 0.4 * (8 * 3.5 + 4.5);
    expect(result).toBeCloseTo(correct);
  });
});
