import { parseDamage } from '../Code';

describe('parseDamage', () => {
  const dice = {
    "1d4": 2.5,
    "1d6": 3.5,
    "1d8": 4.5,
    "1d10": 5.5,
    "1d12": 6.5,
    "1d20": 10.5
  }
  it('should correctly parse basic dice rolls', () => {
    for (let die in dice) {
      const result = parseDamage(die, false, false, false);
      expect(result).toBe(dice[die]);
    }
  });
  
  it('should correctly parse additive damage (+/-)', () => {
    const plus = parseDamage('1d8 + 4', false, false, false);
    expect(plus).toBe(8.5);
    const minus = parseDamage('1d10 - 4', false, false, false);
    expect(minus).toBe(1.5);
  });

  it('should correctly handle min rolls with 1', () => {
    for (let die in dice) {
      const result = parseDamage(die, false, true, false);
      expect(result).toBe(1);
    }
    const result = parseDamage('1d6 + 4', false, true, false);
    expect(result).toBe(5);
  });

  it('should correctly handle max rolls', () => {
    for (let die in dice) {
      const result = parseDamage(die, false, false, true);
      const correct = 2*dice[die] - 1;
      expect(result).toBe(correct);
    }
  });

  it('should correctly handle criticals', () => {
    for (let die in dice) {
      const result = parseDamage(die, true, false, false);
      const correct = 2*dice[die];
      expect(result).toBe(correct);
    }
  });
});
