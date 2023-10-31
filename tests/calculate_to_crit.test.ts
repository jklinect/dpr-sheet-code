import { calculate_to_crit } from "../Code";

describe('calculate_to_crit', () => {
  it('should return 5% for normal calls', () => {
    const result = calculate_to_crit(false, false);
    const correct = 0.05;
    expect(result).toBe(correct);
  });

  it('should return 9.75% with advantage', () => {
    const result = calculate_to_crit(true, false);
    const correct = 0.0975;
    expect(result).toBeCloseTo(correct, 3);
  });

  it('should return 0.25% with disadvantage', () => {
    const result = calculate_to_crit(false, true);
    const correct = 0.0025;
    expect(result).toBeCloseTo(correct, 2);
  });
});