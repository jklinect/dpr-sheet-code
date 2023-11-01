import { calculate_to_hit } from "../Code";

describe('calculate_to_hit', () => {
  it('should return 50% for a flat DC10', () => {
    const result = calculate_to_hit(0, 0, 0, 10, false, false);
    const correct = 0.50;
    expect(result).toBe(correct);
  });

  it('should return 60% for +5 on AC13', () => {
    const result = calculate_to_hit(5, 0, 0, 13, false, false);
    const correct = 0.60;
    expect(result).toBe(correct);
  });

  it('should correctly apply bonus parameters', () => {
    const attack = calculate_to_hit(0, 2, 0, 10, false, false);
    const turn   = calculate_to_hit(0, 0, 2, 10, false, false);
    const correct = 0.60;
    expect(attack).toBe(correct);
    expect(turn).toBe(correct);
  });

  it('should handle advantage correctly', () => {
    const result = calculate_to_hit(0, 0, 0, 10, true, false);
    const correct = 0.70;
    expect(result).toBeCloseTo(correct, 10);
  });
  
  it('should handle disadvantage correctly', () => {
    const result = calculate_to_hit(0, 0, 0, 10, false, true);
    const correct = 0.30; // 1 - 0.6975 - 0.0025
    expect(result).toBeCloseTo(correct, 4);
  });

  it('should handle critical ranges correctly', () => {
    let result = calculate_to_hit(0, 0, 0, 10, false, false, 19);
    let correct = 0.45;
    expect(result).toBeCloseTo(correct);
    result = calculate_to_hit(0, 0, 0, 10, false, false, 18);
    correct = 0.40;
    expect(result).toBe(correct);
  });

  it('should handle critical ranges with advantage', () => {
    const result = calculate_to_hit(0, 0, 0, 10, true, false, 19);
    const correct = 0.6075;
    expect(result).toBeCloseTo(correct, 10);
  });

  it('should handle critical ranges with disadvantage', () => {
    const result = calculate_to_hit(0, 0, 0, 10, false, true, 18);
    const correct = 0.28;
    expect(result).toBe(correct);
  });
});
