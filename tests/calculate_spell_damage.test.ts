import { calculate_spell_damage } from "../Code";
import { expect, describe, it } from "@jest/globals";

describe("calculate_spell_damage", () => {
  it("calculate fireball correctly", () => {
    const result = calculate_spell_damage(15, "8d6", "", "", false, 7, 1);
    const correct = 22.4; // (0.40 * (8*3.5)/2) + (0.60 * (8*3.5))
    expect(result).toBeCloseTo(correct);
  });

  it("calculate fireball with evasion correctly (success = no damage)", () => {
    const result = calculate_spell_damage(15, "8d6", "", "", true, 7, 1);
    const correct = 16.8; // (0.0 * (8*3.5)/2) + (0.60 * (8*3.5))
    expect(result).toBeCloseTo(correct);
  });

  it("calculate fireball with arcane firearm correctly", () => {
    const result = calculate_spell_damage(15, "8d6", "", "1d8", false, 7, 1);
    const correct = 26.0; // (0.40 * (((8*3.5) + 4.5)/2)) + (0.60 * ((8*3.5) + 4.5))
    expect(result).toBeCloseTo(correct);
  });
});
