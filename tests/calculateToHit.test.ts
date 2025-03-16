import { calculateToHit } from "../src/Code";

describe("calculateToHit", () => {
  it("should return 50% for a flat DC10", () => {
    const result = calculateToHit(0, 10, false, false);
    const correct = 0.5;
    expect(result).toBe(correct);
  });

  it("should return 60% for +5 on AC13", () => {
    const result = calculateToHit(5, 13, false, false);
    const correct = 0.6;
    expect(result).toBe(correct);
  });

  it("should correctly apply bonus parameters", () => {
    const attack = calculateToHit(2, 10, false, false);
    const turn = calculateToHit(2, 10, false, false);
    const correct = 0.6;
    expect(attack).toBe(correct);
    expect(turn).toBe(correct);
  });

  it("should handle advantage correctly", () => {
    const result = calculateToHit(0, 10, true, false);
    const correct = 0.7;
    expect(result).toBeCloseTo(correct, 10);
  });

  it("should handle disadvantage correctly", () => {
    const result = calculateToHit(0, 10, false, true);
    const correct = 1 - 0.6975 - 0.0025;
    expect(result).toBeCloseTo(correct, 4);
  });

  it("should handle elven accuracy correctly", () => {
    const result = calculateToHit(0, 10, false, false, 20, true);
    const correct = 1 - 0.45 ** 3 - (1 - 0.95 ** 3);
    expect(result).toBeCloseTo(correct);
  });

  it("should handle critical ranges correctly", () => {
    let result = calculateToHit(0, 10, false, false, 19);
    let correct = 0.45;
    expect(result).toBeCloseTo(correct);
    result = calculateToHit(0, 10, false, false, 18);
    correct = 0.4;
    expect(result).toBe(correct);
  });

  it("should handle critical ranges with advantage", () => {
    const result = calculateToHit(0, 10, true, false, 19);
    const correct = 0.6075;
    expect(result).toBeCloseTo(correct, 10);
  });

  it("should handle critical ranges with disadvantage", () => {
    const result = calculateToHit(0, 10, false, true, 18);
    const correct = 0.28;
    expect(result).toBe(correct);
  });

  it("should handle critical ranges with elven accuracy", () => {
    const result = calculateToHit(0, 10, false, false, 18, true);
    const correct = 1 - 0.45 ** 3 - (1 - 0.85 ** 3);
    expect(result).toBeCloseTo(correct);
  });

  it("should be 0% at infinite AC, rolled all ways", () => {
    const normal = calculateToHit(5, 500, false, false);
    const advantaged = calculateToHit(5, 500, true, false);
    const disadvantaged = calculateToHit(5, 500, false, true);
    const elvenAdvantaged = calculateToHit(5, 500, false, false, 20, true);
    const withWideCritRange = calculateToHit(5, 500, false, false, 18, false);
    const withWideCritRangeAdvantaged = calculateToHit(
      5,
      500,
      true,
      false,
      18,
      false
    );
    const withWideCritRangeDisadvantaged = calculateToHit(
      5,
      500,
      false,
      true,
      18,
      false
    );
    const withWideCritRangeElvenAdvantaged = calculateToHit(
      5,
      500,
      false,
      false,
      18,
      true
    );
    const correct = 0;
    expect(normal).toBe(correct);
    expect(advantaged).toBe(correct);
    expect(disadvantaged).toBe(correct);
    expect(elvenAdvantaged).toBe(correct);
    expect(withWideCritRange).toBe(correct);
    expect(withWideCritRangeAdvantaged).toBe(correct);
    expect(withWideCritRangeDisadvantaged).toBe(correct);
    expect(withWideCritRangeElvenAdvantaged).toBe(correct);
  });

  it("should be 90% at 0 AC", () => {
    const result = calculateToHit(25, 0, false, false);
    const correct = 0.9;
    expect(result).toBeCloseTo(correct);
  });
});
