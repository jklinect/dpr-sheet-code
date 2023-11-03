import { calculate_to_crit } from "../Code";
import { expect, describe, it } from "@jest/globals";

describe("calculate_to_crit", () => {
  it("should return 5% for normal calls", () => {
    const result = calculate_to_crit(false, false);
    const correct = 0.05;
    expect(result).toBe(correct);
  });

  it("should return 9.75% with advantage", () => {
    const result = calculate_to_crit(true, false);
    const correct = 0.0975;
    expect(result).toBeCloseTo(correct, 3);
  });

  it("should return 0.25% with disadvantage", () => {
    const result = calculate_to_crit(false, true);
    const correct = 0.0025;
    expect(result).toBeCloseTo(correct, 2);
  });

  it("should handle crits of 18, 19", () => {
    let result = calculate_to_crit(false, false, 18);
    let correct = 0.15;
    expect(result).toBeCloseTo(correct, 2);
    result = calculate_to_crit(false, false, 19);
    correct = 0.1;
    expect(result).toBeCloseTo(correct, 2);
  });

  it("should handle advantage with critical ranges", () => {
    let result = calculate_to_crit(true, false, 18);
    let correct = 0.2775;
    expect(result).toBeCloseTo(correct, 2);
    result = calculate_to_crit(true, false, 19);
    correct = 0.19;
    expect(result).toBeCloseTo(correct, 2);
  });

  it("should handle disadvantage with critical ranges", () => {
    let result = calculate_to_crit(false, true, 18);
    let correct = 0.0225;
    expect(result).toBeCloseTo(correct, 2);
    result = calculate_to_crit(false, true, 19);
    correct = 0.01;
    expect(result).toBeCloseTo(correct, 2);
  });

  it("should handle elven accuracy with major crit values", () => {
    let result = calculate_to_crit(true, false, 20, true);
    let correct = 0.142625; // 1-0.95**3
    expect(result).toBeCloseTo(correct, 2);
    result = calculate_to_crit(true, false, 19, true);
    correct = 0.271; // 1-0.90**3
    expect(result).toBeCloseTo(correct, 2);
    result = calculate_to_crit(true, false, 18, true);
    correct = 0.385875; // 1-0.85**3
    expect(result).toBeCloseTo(correct, 2);
  });
});
