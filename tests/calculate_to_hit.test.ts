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
    expect(result).toBe(correct);
  });
  
  it('should handle disadvantage correctly', () => {
    const result = calculate_to_hit(0, 0, 0, 10, false, true);
    const correct = 0.3025;
    expect(result).toBeCloseTo(correct, 4);
  });
});